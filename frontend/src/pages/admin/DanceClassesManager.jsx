import React from 'react';
import CrudManager from './CrudManager';

const fields = [
  { key: 'name', label: 'Class Name', required: true, placeholder: 'e.g. Zumba & Dance Fitness' },
  { key: 'level', label: 'Level', placeholder: 'e.g. All Levels' },
  { key: 'schedule', label: 'Schedule', placeholder: 'e.g. Mon, Wed, Fri — 6:30 AM' },
  { key: 'image', label: 'Image URL', placeholder: 'https://...' },
  { key: 'description', label: 'Description', type: 'textarea', required: true },
];

export default function DanceClassesManager() {
  return <CrudManager entityName="Dance Class" apiPath="/dance-classes" fields={fields} />;
}
