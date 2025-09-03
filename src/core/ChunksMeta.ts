export interface ChunkInfo {
    category: string;
    count: number;
    path: string;
}

export class ChunksMeta {
    chunks: ChunkInfo[] = [];
}
