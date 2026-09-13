import { useState } from 'react';
import { Check, LogOut, Plus, Save, Settings as SettingsIcon, Trash2, User } from 'lucide-react';
import { ALLERGENS_LIST } from '../constants';

const makeContact = () => ({ name: '', phone: '', relation: '' });

const normalizeProfile = data => ({
  name: (data?.name || '').trim(),
  email: (data?.email || '').trim(),
  allergens: [...(data?.allergens || [])].map(item => item.trim()).filter(Boolean).sort(),
  contacts: [...(data?.contacts || [])].map(contact => ({
    name: (contact?.name || '').trim(),
    phone: (contact?.phone || '').trim(),
    relation: (contact?.relation || '').trim()
  }))
});

export function Settings({ userProfile, onUpdateProfile, demoMode, setDemoMode, onLogout }) {
  const [profile, setProfile] = useState({
    name: userProfile?.name || '',
    email: userProfile?.email || '',
    allergens: userProfile?.allergens || [],
    contacts: userProfile?.contacts?.length ? userProfile.contacts : [makeContact()]
  });

  const [customAllergen, setCustomAllergen] = useState('');
  const [saved, setSaved] = useState(false);
  const hasChanges = JSON.stringify(normalizeProfile(profile)) !== JSON.stringify(normalizeProfile(userProfile));
  const allergenOptions = [...new Set([...ALLERGENS_LIST, ...profile.allergens])];

  const toggleAllergen = item => {
    const nextAllergens = profile.allergens.includes(item)
      ? profile.allergens.filter(value => value !== item)
      : [...profile.allergens, item];
    const nextProfile = { ...profile, allergens: nextAllergens };
    setProfile(nextProfile);
    onUpdateProfile(nextProfile);
  };

  const addCustomAllergen = () => {
    const item = customAllergen.trim();
    if (!item) return;
    const nextProfile = profile.allergens.includes(item)
      ? profile
      : { ...profile, allergens: [...profile.allergens, item] };
    setProfile(nextProfile);
    onUpdateProfile(nextProfile);
    setCustomAllergen('');
  };

  const updateField = (field, value) => setProfile(prev => ({ ...prev, [field]: value }));

  const updateContact = (index, field, value) => setProfile(prev => ({
    ...prev,
    contacts: prev.contacts.map((contact, contactIndex) => contactIndex === index ? { ...contact, [field]: value } : contact)
  }));

  const addContact = () => setProfile(prev => ({ ...prev, contacts: [...prev.contacts, makeContact()] }));

  const removeContact = index => setProfile(prev => {
    const contacts = prev.contacts.filter((_, contactIndex) => contactIndex !== index);
    return { ...prev, contacts: contacts.length ? contacts : [makeContact()] };
  });

  const save = () => {
    const contacts = profile.contacts
      .map(contact => ({
        name: (contact.name || '').trim(),
        phone: (contact.phone || '').trim(),
        relation: (contact.relation || '').trim()
      }))
      .filter(contact => contact.name || contact.phone || contact.relation);

    const nextProfile = {
      ...profile,
      name: profile.name.trim(),
      email: profile.email.trim(),
      allergens: [...new Set(profile.allergens.map(item => item.trim()).filter(Boolean))],
      contacts: contacts.length ? contacts : [makeContact()]
    };

    onUpdateProfile(nextProfile);
    setProfile(nextProfile);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="settings-page panel">
      <div className="settings-header">
        <div><h2>Workspace Settings</h2><p>Manage your profile and app preferences</p></div>
        {hasChanges && <button type="button" onClick={save} className="primary-button settings-save-button">{saved ? <Check size={16} /> : <Save size={16} />}{saved ? 'Saved' : 'Save Changes'}</button>}
      </div>

      <section className="settings-section">
        <h3><SettingsIcon size={18} /> System Preferences</h3>
        <div className="preference-row"><div><b>Demo Mode</b><p>Bypass live API calls and return mock data.</p></div><button aria-label="Toggle demo mode" onClick={() => setDemoMode(!demoMode)} className={`toggle ${demoMode ? 'on' : ''}`}><span /></button></div>
      </section>

      <section className="settings-section">
        <h3><User size={18} /> Personal Information</h3>
        <div className="settings-grid">
          <label className="settings-field"><span className="label">Full Name</span><input className="field" value={profile.name} onChange={event => updateField('name', event.target.value)} /></label>
          <label className="settings-field"><span className="label">Email</span><input className="field" type="email" value={profile.email} onChange={event => updateField('email', event.target.value)} /></label>
        </div>
        <div className="settings-subsection">
          <div className="settings-subheader"><span className="label">Emergency Contacts</span></div>
          <div className="settings-contact-grid">{profile.contacts.map((contact, index) => <div key={index} className="contact-card"><div className="contact-card-header"><span>Contact {index + 1}</span>{profile.contacts.length > 1 && <button type="button" className="text-button danger-text-button" onClick={() => removeContact(index)}><Trash2 size={14} /> Remove</button>}</div><div className="settings-grid"><label className="settings-field"><span className="label">Name</span><input className="field" value={contact.name} onChange={event => updateContact(index, 'name', event.target.value)} /></label><label className="settings-field"><span className="label">Contact Number</span><input className="field" type="tel" value={contact.phone} onChange={event => updateContact(index, 'phone', event.target.value)} /></label><label className="settings-field full-width"><span className="label">Relation</span><input className="field" value={contact.relation} onChange={event => updateContact(index, 'relation', event.target.value)} /></label></div></div>)}</div>
          <button type="button" className="secondary-button add-row-button" onClick={addContact}><Plus size={16} /> Add another contact</button>
        </div>
      </section>

      <section className="settings-section">
        <h3><SettingsIcon size={18} /> Allergy Types</h3>
        <div className="allergen-grid">{allergenOptions.map(item => <button key={item} type="button" className={`allergen-option ${profile.allergens.includes(item) ? 'selected' : ''}`} onClick={() => toggleAllergen(item)}>{item}</button>)}</div>
        <div className="custom-allergen-row"><input className="field" value={customAllergen} onChange={event => setCustomAllergen(event.target.value)} placeholder="Add your own allergy type" /><button type="button" className="primary-button" onClick={addCustomAllergen}>Add</button></div>
      </section>

      <div className="settings-footer"><button type="button" className="secondary-button danger-button" onClick={onLogout}><LogOut size={16} /> Logout</button></div>
    </div>
  );
}
