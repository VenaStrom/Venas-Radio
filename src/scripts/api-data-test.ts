import "dotenv/config";

async function episodes() {
  /**
  * Extract episode types
  */
  const programArgs = `?${process.env.API_COMMON_ARGS}&isarchived=false`;
  const programApiURL = process.env.API_PROGRAM_INDEX_URL + programArgs;
  const programs = (await (await fetch(programApiURL)).json()).programs;

  let episodes: any[] = [];

  const randomPrograms = programs.sort(() => 0.5 - Math.random()).slice(0, 6);
  const fetchers: Promise<any>[] = [];
  randomPrograms.forEach((program: any) => {
    const programId = program.id;
    const episodeArgs = `?${process.env.API_COMMON_ARGS}&programid=${programId}`;
    const apiURL = process.env.API_EPISODE_URL + episodeArgs;

    fetchers.push(fetch(apiURL).then(res => res.json()));
  });
  const results = await Promise.all(fetchers);
  results.forEach((result: any) => {
    if (result.episodes) {
      episodes = [...episodes, ...result.episodes];
    }
  });

  // Find the different episode types
  const listenpodfileEpisodes: any[] = [];
  const downloadpodfileEpisodes: any[] = [];
  const listenAndDownloadPodfileEpisodes: any[] = [];
  const broadcastEpisodes: any[] = [];
  const allOfTheAboveEpisodes: any[] = [];
  const noneOfTheAboveEpisodes: any[] = [];
  episodes.forEach((episode: any) => {
    if (episode.listenpodfile && episode.downloadpodfile && episode.broadcast) {
      allOfTheAboveEpisodes.push(episode);
    } else if (episode.listenpodfile && episode.downloadpodfile) {
      listenAndDownloadPodfileEpisodes.push(episode);
    } else if (episode.listenpodfile) {
      listenpodfileEpisodes.push(episode);
    } else if (episode.downloadpodfile) {
      downloadpodfileEpisodes.push(episode);
    } else if (episode.broadcast) {
      broadcastEpisodes.push(episode);
    } else {
      noneOfTheAboveEpisodes.push(episode);
    }
  });

  // console.dir(listenAndDownloadPodfileEpisodes[0], { depth: null });


  // const listenstruct = episodes.filter(episode => episode.listenpodfile).map(episode => episode.listenpodfile);
  // const downloadstruct = episodes.filter(episode => episode.downloadpodfile).map(episode => episode.downloadpodfile);
  // const broadcaststruct = episodes.filter(episode => episode.broadcast).map(episode => episode.broadcast);
  // const broadcasttimeStruct = episodes.filter(episode => episode.broadcasttime).map(episode => episode.broadcasttime);
  // const programStruct = episodes.filter(episode => episode.program).map(episode => episode.program);

  // const listenpodfileTypeMap = typeMapper(listenstruct);
  // console.log("Listen podfile type map:");
  // console.dir(listenpodfileTypeMap, { depth: null });

  // const downloadpodfileTypeMap = typeMapper(downloadstruct);
  // console.log("Download podfile type map:");
  // console.dir(downloadpodfileTypeMap, { depth: null });

  // const broadcastTypeMap = typeMapper(broadcaststruct);
  // console.log("Broadcast type map:");
  // console.dir(broadcastTypeMap, { depth: null });

  // const broadcasttimeTypeMap = typeMapper(broadcasttimeStruct);
  // console.log("Broadcast time type map:");
  // console.dir(broadcasttimeTypeMap, { depth: null });

  // const programTypeMap = typeMapper(programStruct);
  // console.log("Program type map:");
  // console.dir(programTypeMap, { depth: null });


  // const allEpisodeTypeMap = typeMapper(episodes);
  // console.log("All episode type map:");
  // console.dir(allEpisodeTypeMap, { depth: null });

  // const listenAndDownloadPodfileEpisodesTypeMap = typeMapper(listenAndDownloadPodfileEpisodes);
  // console.log("Listen and download podfile episodes type map:");
  // console.dir(listenAndDownloadPodfileEpisodesTypeMap, { depth: null });

  // const broadcastEpisodesTypeMap = typeMapper(broadcastEpisodes);
  // console.log("Broadcast episodes type map:");
  // console.dir(broadcastEpisodesTypeMap, { depth: null });
}

async function programs() {
  /**
   * Extract program types
   */
  const programArgs = `?${process.env.API_COMMON_ARGS}&isarchived=false`;
  const programApiURL = process.env.API_PROGRAM_INDEX_URL + programArgs;
  const programs = (await (await fetch(programApiURL)).json()).programs;

  console.dir(programs[0], { depth: null });

  // const typeMap = typeMapper(programs);
  // console.log("Program type map:");
  // console.dir(typeMap, { depth: null });
}

async function channels() {
  /**
   * Extract channel types
   */
  const args = `?${process.env.API_COMMON_ARGS}`;
  const apiURL = process.env.API_CHANNEL_INDEX_URL + args;
  const channels = (await (await fetch(apiURL)).json()).channels;

  const typeMap = typeMapper(channels);
  console.log("Channel type map:");
  console.dir(typeMap, { depth: null });
}

// episodes()
programs()
// channels()

function typeMapper(dataset: any[]): Record<string, string> {
  const datasetLength = dataset.length;
  const propTypes: Record<string, string> = {};
  const propCounts: Record<string, number> = {};
  const typeMap: Record<string, any> = {};

  // Map types widely and count properties
  dataset.forEach((episode: any) => {
    Object.entries(episode).forEach(([key, value]) => {
      propTypes[key] = typeof value;
      propCounts[key] = (propCounts[key] || 0) + 1;
    });
  });

  // Create type map with the optional properties marked
  const episodeOptionalProps = Object.keys(propCounts).filter(key => propCounts[key] < datasetLength);
  Object.entries(propTypes).forEach(([key, value]) => {
    typeMap[key] = value + (episodeOptionalProps.includes(key) ? "?" : "");
  });

  // console.dir(typeMap, { depth: null });

  return typeMap;
}


/**
 * Extract program types
 */

// import apiPrograms from "../../api-programs-response.json" with {type: "json"};

// // I don't really know the exact return type of this API, so this script will go through roughly 500 programs and map out the structure, including nested stuff

// const programCount = apiPrograms.length;
// const propTypes: Record<string, string> = {};
// const propCounts: Record<string, number> = {};
// const typeMap: Record<string, any> = {};

// // Map types widely and count properties
// apiPrograms.forEach(program => {
//   Object.entries(program).forEach(([key, value]) => {
//     propTypes[key] = typeof value;
//     propCounts[key] = (propCounts[key] || 0) + 1;
//   });
// });

// // Create type map with the optional properties marked
// const optionalProps = Object.keys(propCounts).filter(key => propCounts[key] < programCount);
// Object.entries(propTypes).forEach(([key, value]) => {
//   typeMap[key] = value + (optionalProps.includes(key) ? "?" : "");
// });

// console.dir(typeMap, { depth: null });



/**
 * Extract channel types
 */
// import "dotenv/config";

// const args = "?format=json&pagination=false";
// const apiURL = process.env.API_CHANNEL_INDEX_URL + args;
// const channels = (await (await fetch(apiURL)).json()).channels;

// const channelCount = channels.length;
// const propTypes: Record<string, string> = {};
// const propCounts: Record<string, number> = {};
// const typeMap: Record<string, any> = {};

// // Map types widely and count properties
// channels.forEach((channel: any) => {
//   Object.entries(channel).forEach(([key, value]) => {
//     propTypes[key] = typeof value;
//     propCounts[key] = (propCounts[key] || 0) + 1;
//   });
// });

// // Create type map with the optional properties marked
// const optionalProps = Object.keys(propCounts).filter(key => propCounts[key] < channelCount);
// Object.entries(propTypes).forEach(([key, value]) => {
//   typeMap[key] = value + (optionalProps.includes(key) ? "?" : "");
// });

// console.dir(typeMap, { depth: null });
