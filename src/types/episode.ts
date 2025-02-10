export type Episode = {
    id: number;
    title: string;
    description: string;
    url: string;
    index?: number;
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

// {
//     "id": 2528369,
//     "title": "Ekot senaste nytt",
//     "description": "Senaste nyheterna varje timme från Ekot.",
//     "url": "https://sverigesradio.se/avsnitt/2528369",
//     "program": {
//       "id": 5380,
//       "name": "Ekot senaste nytt"
//     },
//     "audiopreference": "default",
//     "audiopriority": "aac",
//     "audiopresentation": "format",
//     "publishdateutc": "/Date(1738743900000)/",
//     "imageurl": "https://static-cdn.sr.se/images/5380/a7898d6c-786f-4fcb-b68e-c5f56f4b3bef.jpg?preset=api-default-square",
//     "imageurltemplate": "https://static-cdn.sr.se/images/5380/a7898d6c-786f-4fcb-b68e-c5f56f4b3bef.jpg",
//     "photographer": "",
//     "broadcast": {
//       "availablestoputc": "/Date(1741335960000)/",
//       "playlist": {
//         "duration": 60,
//         "publishdateutc": "/Date(1738743900000)/",
//         "id": 9651371,
//         "url": "https://api.sr.se/api/radio/radio.aspx?type=broadcast&id=9651371&codingformat=.m4a&metafile=asx",
//         "statkey": "/app/avsnitt/nyheter (ekot)[k(83)]/ekot senaste nytt[p(5380)]/[e(2528369)]"
//       },
//       "broadcastfiles": [
//         {
//           "duration": 60,
//           "publishdateutc": "/Date(1738743900000)/",
//           "id": 9651371,
//           "url": "https://www.sverigesradio.se/topsy/ljudfil/srapi/9651371.m4a",
//           "statkey": "/app/avsnitt/nyheter (ekot)[k(83)]/ekot senaste nytt[p(5380)]/[e(2528369)]"
//         }
//       ]
//     },
//     "broadcasttime": {
//       "starttimeutc": "/Date(1738743900000)/",
//       "endtimeutc": "/Date(1738743960000)/"
//     },
//     "channelid": 701
//   }