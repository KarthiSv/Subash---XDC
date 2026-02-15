import React from 'react';
import CrudManager from './CrudManager';

const fields = [
  { key: 'name', label: 'Costume Name', required: true, placeholder: 'e.g. Royal Bharatanatyam Set' },
  { key: 'category', label: 'Category', required: true, placeholder: 'e.g. Classical, Bollywood, Folk' },
  { key: 'price', label: 'Rental Price', required: true, placeholder: 'e.g. ₹2,500/3 days' },
  { key: 'image', label: 'Image URL', placeholder: 'https://...' },
  { key: 'description', label: 'Description', type: 'textarea' },
];

export default function CostumesManager() {
  return <CrudManager entityName="Costume" apiPath="/costumes" fields={fields} />;
}
