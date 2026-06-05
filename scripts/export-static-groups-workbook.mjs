import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SpreadsheetFile, Workbook } from '@oai/artifact-tool';
import { GROUPS_DATA } from '../.spreadsheet-work/compiled/data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outputDir = path.join(rootDir, 'outputs');
const outputPath = path.join(outputDir, '静态小组球队数据.xlsx');

const workbook = Workbook.create();

const flatSheet = workbook.worksheets.add('小组球队汇总');
const groupedSheet = workbook.worksheets.add('按小组查看');

const flatRows = [
  ['小组', '组内序号', '球队ID', '球队名称', '旗帜', '世界排名', '初始场次', '初始积分', '初始净胜球', '初始名次'],
  ...GROUPS_DATA.flatMap((group) =>
    group.teams.map((entry, index) => [
      group.id,
      index + 1,
      entry.team.id,
      entry.team.name,
      entry.team.flag,
      entry.team.rank,
      entry.played,
      entry.points,
      entry.goalDiff,
      entry.rank,
    ]),
  ),
];

flatSheet.getRange(`A1:J${flatRows.length}`).values = flatRows;
flatSheet.getRange('A1:J1').format.fill = 'accent1';
flatSheet.getRange('A1:J1').format.font = { color: '#FFFFFF', bold: true };
flatSheet.getRange('A1:J1').format.horizontalAlignment = 'center';
flatSheet.getRange(`A1:J${flatRows.length}`).format.autofitColumns();

const groupedRows = [];
for (const group of GROUPS_DATA) {
  groupedRows.push([`小组 ${group.id}`]);
  groupedRows.push(['组内序号', '球队ID', '球队名称', '旗帜', '世界排名', '初始场次', '初始积分', '初始净胜球', '初始名次']);
  for (const [index, entry] of group.teams.entries()) {
    groupedRows.push([
      index + 1,
      entry.team.id,
      entry.team.name,
      entry.team.flag,
      entry.team.rank,
      entry.played,
      entry.points,
      entry.goalDiff,
      entry.rank,
    ]);
  }
  groupedRows.push([]);
}

groupedSheet.getRange(`A1:I${groupedRows.length}`).values = groupedRows;

let cursor = 1;
for (const group of GROUPS_DATA) {
  groupedSheet.getRange(`A${cursor}:I${cursor}`).merge();
  groupedSheet.getRange(`A${cursor}:I${cursor}`).format.fill = 'accent2';
  groupedSheet.getRange(`A${cursor}:I${cursor}`).format.font = { color: '#FFFFFF', bold: true };
  cursor += 1;
  groupedSheet.getRange(`A${cursor}:I${cursor}`).format.fill = 'accent1';
  groupedSheet.getRange(`A${cursor}:I${cursor}`).format.font = { color: '#FFFFFF', bold: true };
  cursor += group.teams.length + 2;
}

groupedSheet.getRange(`A1:I${groupedRows.length}`).format.autofitColumns();

await fs.mkdir(outputDir, { recursive: true });
const exported = await SpreadsheetFile.exportXlsx(workbook);
await exported.save(outputPath);

console.log(outputPath);
