import { Workbook } from '@oai/artifact-tool';
const workbook = Workbook.create();
const result = await workbook.help('worksheet range values');
console.log(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
