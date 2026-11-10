import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const manifestPath = resolve('android/app/src/main/AndroidManifest.xml');
const variablesPath = resolve('android/variables.gradle');
let variables = readFileSync(variablesPath, 'utf8');
const minSdk = variables.match(/minSdkVersion\s*=\s*(\d+)/);
if (!minSdk) throw new Error('Could not locate minSdkVersion in android/variables.gradle.');
if (Number(minSdk[1]) < 26) {
  variables = variables.replace(/minSdkVersion\s*=\s*\d+/, 'minSdkVersion = 26');
  writeFileSync(variablesPath, variables);
  console.log('Raised Android minSdkVersion to 26 for Health Connect compatibility.');
}
let xml = readFileSync(manifestPath, 'utf8');

if (!xml.includes('xmlns:tools=')) {
  xml = xml.replace('<manifest ', '<manifest xmlns:tools="http://schemas.android.com/tools" ');
}

const types = [
  'STEPS', 'DISTANCE', 'ACTIVE_CALORIES_BURNED', 'HEART_RATE', 'WEIGHT',
  'SLEEP', 'RESPIRATORY_RATE', 'OXYGEN_SATURATION', 'RESTING_HEART_RATE',
  'HEART_RATE_VARIABILITY', 'VO2_MAX', 'BLOOD_PRESSURE', 'BLOOD_GLUCOSE',
  'BODY_TEMPERATURE', 'HEIGHT', 'FLOORS_CLIMBED', 'BODY_FAT',
  'BASAL_BODY_TEMPERATURE', 'BASAL_METABOLIC_RATE', 'TOTAL_CALORIES_BURNED',
  'MINDFULNESS', 'HYDRATION', 'NUTRITION', 'EXERCISE',
];

const block = [
  '    <!-- DUO HEALTH CONNECT PERMISSIONS START -->',
  '    <uses-permission android:name="android.permission.health.READ_STEPS" />',
  ...types.flatMap((type) => ['READ', 'WRITE']
    .filter((mode) => !(mode === 'READ' && type === 'STEPS'))
    .map((mode) => `    <uses-permission android:name="android.permission.health.${mode}_${type}" tools:node="remove" />`)),
  '    <!-- DUO HEALTH CONNECT PERMISSIONS END -->',
].join('\n');

xml = xml.replace(/\s*<!-- DUO HEALTH CONNECT PERMISSIONS START -->[\s\S]*?<!-- DUO HEALTH CONNECT PERMISSIONS END -->\s*/g, '\n');
xml = xml.replace(/\s*<application\b/, '\n' + block + '\n    <application');
writeFileSync(manifestPath, xml);
console.log('Configured Health Connect manifest: READ_STEPS only; all other health scopes are removed.');
