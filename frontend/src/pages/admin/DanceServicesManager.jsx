import React from 'react';
import CrudManager from './CrudManager';

const fields = [
  { key: 'title', label: 'Service Title', required: true, placeholder: 'e.g. Sangeet Choreography' },
  { key: 'for_whom', label: 'For Whom', placeholder: 'e.g. Brides & grooms, families' },
  { key: 'icon', label: 'Icon Name', placeholder: 'e.g. Heart, Music, Home' },
  { key: 'image', label: 'Image URL', placeholder: 'https://...' },
  { key: 'description', label: 'Description', type: 'textarea', required: true },
];

export default function DanceServicesManager() {
  return <CrudManager entityName="Dance Service" apiPath="/dance-services" fields={fields} />;
}
