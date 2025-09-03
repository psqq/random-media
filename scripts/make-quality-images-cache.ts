import axios from 'axios';
import wtf from 'wtf_wikipedia';

import fs from 'node:fs';
import crypto from 'node:crypto';

import { WikiImg } from '../src/WikiImg';

type AxiosCachedOptions<T> = {
    getDataFromResponse: (response: Axios.AxiosXHR<any>) => T;
    getDataByFileContent: (content: string) => T;
    convertDataToFileContent: (data: T) => string;
    getFilename: (config: Axios.AxiosXHRConfig<any>) => string;
};

class AxiosCached<T> {
    fileData: Record<string, string>;
    fileUrl: Record<string, string>;
    options: AxiosCachedOptions<T>;
    fileUrlFilepath = 'data/cache/file-url.json';

    constructor(options: AxiosCachedOptions<T>) {
        this.options = options;
        this.fileData = {};
        this.fileUrl = {};
    }

    async init() {
        if (!fs.existsSync(this.fileUrlFilepath)) {
            return;
        }
        let fileUrlContent = await fs.promises.readFile(this.fileUrlFilepath, {
            encoding: 'utf-8',
        });
        this.fileUrl = JSON.parse(fileUrlContent);
    }

    async saveFileUrl() {
        await fs.promises.writeFile(this.fileUrlFilepath, JSON.stringify(this.fileUrl, null, 4), {
            encoding: 'utf-8',
        });
    }

    async getFileData(filepath: string) {
        let fileContent = '';
        if (this.fileData[filepath]) {
            fileContent = this.fileData[filepath];
        } else {
            fileContent = await fs.promises.readFile(filepath, { encoding: 'utf-8' });
            this.fileData[filepath] = fileContent;
        }
        return this.options.getDataByFileContent(fileContent);
    }

    getFilepath(config: Axios.AxiosXHRConfig<any>) {
        const filename = this.options.getFilename(config);
        const filepath = `data/cache/${filename}`;

        return filepath;
    }

    async createFileData(config: Axios.AxiosXHRConfig<any>, data: T) {
        const filepath = this.getFilepath(config);
        if (filepath in this.fileData) {
            throw new Error(`createFileData: ${filepath} already exists in cache`);
        }
        this.fileData[filepath] = this.options.convertDataToFileContent(data);
        await fs.promises.writeFile(filepath, this.fileData[filepath], {
            encoding: 'utf-8',
        });
    }

    async fetch(config: Axios.AxiosXHRConfig<any>) {
        const filepath = this.getFilepath(config);
        this.fileUrl[config.url] = filepath;
        if (fs.existsSync(filepath)) {
            return this.getFileData(filepath);
        }
        const response = await axios(config);
        const data = this.options.getDataFromResponse(response);
        await this.createFileData(config, data);
        return data;
    }
}

const axiosCached = new AxiosCached<string>({
    convertDataToFileContent(data) {
        return data;
    },
    getDataByFileContent(content) {
        return content;
    },
    getDataFromResponse(response) {
        try {
            const content = (Object.values(response.data?.query?.pages as any)[0] as any).revisions[0]['*'];
            if (typeof content === 'string') {
                return content;
            }
        } catch (err) {}
        return '';
    },
    getFilename(config) {
        const hash = crypto.createHash('md5').update(config.url).digest('hex');
        return `${hash}.wiki`;
    },
});

class Parser {
    url: string;
    data = '';

    constructor(titles: string) {
        this.url = `https://commons.wikimedia.org/w/api.php?action=query&prop=revisions&titles=${titles}&rvprop=content&format=json`;
    }

    async fetch() {
        this.data = await axiosCached.fetch({
            url: this.url,
            method: 'get',
        });
    }

    /**
     * Return array of strings like ['Commons:Quality images/Technical/Exposure', ...]
     */
    getSubcategories() {
        const content = this.data;
        const doc = wtf(content);
        const subcategories = [];
        const links = doc.links() as any as wtf.Link[];
        for (const link of links) {
            if (link.wiki() !== 'commons') {
                continue;
            }
            if (!link.page().startsWith('Quality images')) {
                continue;
            }
            subcategories.push(`Commons:${link.page()}`);
        }

        return subcategories;
    }

    getImages() {
        const content = this.data;
        const doc = wtf(content);
        const images = doc.images();

        return images;
    }
}

const parsers = new Map<string, Parser>();
const allImages = new Map<string, WikiImg>();

async function parseCategory(category: string) {
    if (parsers.has(category)) {
        return;
    }
    const parser = new Parser(category);
    parsers.set(category, parser);
    console.log(parsers.size, 'Fetching', category);
    await parser.fetch();
    try {
        const images = parser.getImages();
        for (const img of images) {
            const wImg = new WikiImg();
            wImg.file = img.file();
            wImg.thumb = img.thumb();
            wImg.url = img.url();
            wImg.category = category;
            allImages.set(wImg.url, wImg);
        }
    } catch (err) {
        console.log('getImages err:', (err as any)?.message);
    }
    try {
        const subcategories = parser.getSubcategories();
        for (const subcategory of subcategories) {
            await parseCategory(subcategory);
        }
    } catch (err) {
        console.log('getSubcategories err:', (err as any)?.message);
    }
}

await parseCategory('Commons:Quality_images');

await axiosCached.saveFileUrl();

await fs.promises.writeFile('data/cache/all-quality-images.json', JSON.stringify([...allImages.values()]), {
    encoding: 'utf-8',
});
