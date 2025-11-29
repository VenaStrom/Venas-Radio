export type SR_Episode = {
    id: number;
    title: string;
    description: string;
    url: string;
    order?: number;
    program: {
        id: number;
        name: string;
    };
    audiopreference: string;
    audiopriority: string;
    audiopresentation: string;
    publishdateutc: string;
    publishDate?: Date;
    imageurl: string;
    imageurltemplate: string;
    photographer: string;
    listenpodfile: {
        title: string;
        description: string;
        filesizeinbytes: number;
        program: {
            id: number;
            name: string;
        };
        availablefromutc: string;
        duration: number;
        publishdateutc: string;
        id: number;
        url: string;
        statkey: string;
    };
    downloadpodfile: {
        title: string;
        description: string;
        filesizeinbytes: number;
        program: {
            id: number;
            name: string;
        };
        availablefromutc: string;
        duration: number;
        publishdateutc: string;
        id: number;
        url: string;
        statkey: string;
    };
    broadcast?: {
        availablestoputc: string;
        playlist: {
            duration: number;
            publishdateutc: string;
            id: number;
            url: string;
            statkey: string;
        };
        broadcastfiles: {
            duration: number;
            publishdateutc: string;
            id: number;
            url: string;
            statkey: string;
        }[];
    };
    broadcasttime?: {
        starttimeutc: string;
        endtimeutc: string;
    };
};