/*

  https://stackoverflow.com/questions/15900485/correct-way-to-convert-size-in-bytes-to-kb-mb-gb-in-javascript

  // formatBytes(bytes,decimals)
  formatBytes(1024);       // 1 KB
  formatBytes('1024');     // 1 KB
  formatBytes(1234);       // 1.21 KB
  formatBytes(1234, 3);    // 1.205 KB

*/
export default function formatBytes(bytes,decimals) {
   if(bytes === 0) return '0 Bytes'
   const k = 1024
   const dm = decimals || 2
   const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
   const i = Math.floor(Math.log(bytes) / Math.log(k))
   return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}
