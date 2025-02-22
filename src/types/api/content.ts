export type Content = {
    id: number;
    title: string;
    description: string;
    image: {
        square: string;
        wide: string;
    };
    url: string;
    program: {
        id: number;
        name: string;
    }
    publishDate: Date;
    duration: number;
}