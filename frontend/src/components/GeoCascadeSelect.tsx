import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, MapPin, Building, Globe, Map } from 'lucide-react';
import { GEO_DATA, GeoCountry, GeoDepartment, GeoCommune, GeoCity, findCountry } from '../data/geoData';

export interface GeoSelection {
  country: string;       // Libellé (ex: "Bénin")
  countryCode: string;   // Code ISO (ex: "BJ")
  department: string;    // Libellé (ex: "Littoral")
  commune: string;       // Libellé (ex: "Cotonou")
  city: string;          // Libellé (ex: "12e Arrondissement (Cadjèhoun, Haie Vive)")
}

interface GeoCascadeSelectProps {
  initialValues?: Partial<GeoSelection>;
  onChange: (selection: GeoSelection) => void;
  required?: boolean;
  disabled?: boolean;
  compact?: boolean;
}

// Composant de sélection déroulante avec barre de filtre/recherche intégrée
interface SearchableDropdownProps {
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  searchPlaceholder: string;
  options: Array<{ id: string; name: string; flag?: string }>;
  selectedName: string;
  onSelect: (option: { id: string; name: string; flag?: string }) => void;
  disabled?: boolean;
  disabledNotice?: string;
  required?: boolean;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  label,
  icon,
  placeholder,
  searchPlaceholder,
  options,
  selectedName,
  onSelect,
  disabled = false,
  disabledNotice,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fermer la liste déroulante au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Autofocus sur le champ de recherche à l'ouverture
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    } else {
      setSearch('');
    }
  }, [isOpen]);

  const filteredOptions = options.filter((opt) =>
    opt.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          {icon}
          <span>{label}</span>
          {required && <span className="text-rose-500">*</span>}
        </span>
      </label>

      {/* Bouton d'affichage du sélecteur */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left bg-slate-50 border rounded-xl px-3 py-2.5 text-xs font-semibold flex items-center justify-between transition ${
          disabled
            ? 'opacity-60 bg-slate-100 border-slate-200 cursor-not-allowed text-slate-400'
            : isOpen
            ? 'border-brand-500 bg-white ring-2 ring-brand-500/20 text-slate-900 shadow-xs'
            : 'border-slate-200 hover:border-slate-300 text-slate-800'
        }`}
      >
        <span className="truncate">
          {selectedName || (
            <span className="text-slate-400 font-normal">
              {disabled && disabledNotice ? disabledNotice : placeholder}
            </span>
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ml-2 ${
            isOpen ? 'rotate-180 text-brand-600' : ''
          }`}
        />
      </button>

      {/* Menu déroulant avec champ de recherche */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Barre de recherche intégrée */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/70">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                data-lpignore="true"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-2.5 py-1.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Liste des éléments filtrés */}
          <div className="max-h-48 overflow-y-auto divide-y divide-slate-50 p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = selectedName === opt.name;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onSelect(opt);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs rounded-lg flex items-center justify-between transition ${
                      isSelected
                        ? 'bg-brand-50 text-brand-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      {opt.flag && <span className="text-sm">{opt.flag}</span>}
                      <span className="truncate">{opt.name}</span>
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-brand-600 shrink-0 ml-2" />}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-4 text-center text-xs text-slate-400">
                Aucun résultat pour "{search}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const GeoCascadeSelect: React.FC<GeoCascadeSelectProps> = ({
  initialValues,
  onChange,
  required = true,
  disabled = false,
  compact = false,
}) => {
  // Sélection en cours
  const defaultCountry = findCountry(initialValues?.countryCode || initialValues?.country || 'BJ') || GEO_DATA[0];

  const [selectedCountryObj, setSelectedCountryObj] = useState<GeoCountry>(defaultCountry);
  const [selectedDepartment, setSelectedDepartment] = useState<string>(initialValues?.department || '');
  const [selectedCommune, setSelectedCommune] = useState<string>(initialValues?.commune || '');
  const [selectedCity, setSelectedCity] = useState<string>(initialValues?.city || '');

  // Synchronisation si initialValues change
  useEffect(() => {
    if (initialValues?.countryCode || initialValues?.country) {
      const match = findCountry(initialValues.countryCode || initialValues.country || '');
      if (match && match.code !== selectedCountryObj.code) {
        setSelectedCountryObj(match);
      }
    }
    if (initialValues?.department !== undefined) setSelectedDepartment(initialValues.department);
    if (initialValues?.commune !== undefined) setSelectedCommune(initialValues.commune);
    if (initialValues?.city !== undefined) setSelectedCity(initialValues.city);
  }, [initialValues]);

  // Options calculées selon les niveaux supérieurs
  const departmentOptions = selectedCountryObj.departments.map((d) => ({
    id: d.id,
    name: d.name,
  }));

  const currentDeptObj = selectedCountryObj.departments.find(
    (d) => d.name === selectedDepartment || d.id === selectedDepartment
  );

  const communeOptions = currentDeptObj
    ? currentDeptObj.communes.map((c) => ({ id: c.id, name: c.name }))
    : [];

  const currentCommuneObj = currentDeptObj?.communes.find(
    (c) => c.name === selectedCommune || c.id === selectedCommune
  );

  const cityOptions = currentCommuneObj
    ? currentCommuneObj.cities.map((ct) => ({ id: ct.id, name: ct.name }))
    : [];

  // Notifications des changements au parent
  const emitChange = (update: Partial<GeoSelection>) => {
    const next: GeoSelection = {
      country: update.country ?? selectedCountryObj.name,
      countryCode: update.countryCode ?? selectedCountryObj.code,
      department: update.department ?? selectedDepartment,
      commune: update.commune ?? selectedCommune,
      city: update.city ?? selectedCity,
    };
    onChange(next);
  };

  // 1. Changement de Pays
  const handleCountrySelect = (opt: { id: string; name: string }) => {
    const newCountry = GEO_DATA.find((c) => c.code === opt.id || c.name === opt.name) || GEO_DATA[0];
    setSelectedCountryObj(newCountry);
    // Réinitialise les niveaux inférieurs
    setSelectedDepartment('');
    setSelectedCommune('');
    setSelectedCity('');
    emitChange({
      country: newCountry.name,
      countryCode: newCountry.code,
      department: '',
      commune: '',
      city: '',
    });
  };

  // 2. Changement de Département
  const handleDepartmentSelect = (opt: { id: string; name: string }) => {
    setSelectedDepartment(opt.name);
    // Réinitialise commune et ville
    setSelectedCommune('');
    setSelectedCity('');
    emitChange({
      department: opt.name,
      commune: '',
      city: '',
    });
  };

  // 3. Changement de Commune
  const handleCommuneSelect = (opt: { id: string; name: string }) => {
    setSelectedCommune(opt.name);
    // Réinitialise la ville
    setSelectedCity('');
    emitChange({
      commune: opt.name,
      city: '',
    });
  };

  // 4. Changement de Ville
  const handleCitySelect = (opt: { id: string; name: string }) => {
    setSelectedCity(opt.name);
    emitChange({
      city: opt.name,
    });
  };

  return (
    <div className={`space-y-3 ${compact ? 'text-xs' : ''}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* 1. Pays */}
        <SearchableDropdown
          label="Pays"
          icon={<Globe className="w-3.5 h-3.5 text-brand-600" />}
          placeholder="Sélectionnez votre pays"
          searchPlaceholder="Rechercher un pays..."
          options={GEO_DATA.map((c) => ({ id: c.code, name: c.name, flag: c.flag }))}
          selectedName={selectedCountryObj.name}
          onSelect={handleCountrySelect}
          disabled={disabled}
          required={required}
        />

        {/* 2. Département / Région */}
        <SearchableDropdown
          label="Département / Région"
          icon={<Map className="w-3.5 h-3.5 text-brand-600" />}
          placeholder="Sélectionnez le département"
          searchPlaceholder="Filtrer les départements..."
          options={departmentOptions}
          selectedName={selectedDepartment}
          onSelect={handleDepartmentSelect}
          disabled={disabled || !selectedCountryObj}
          disabledNotice="Sélectionnez d'abord un pays"
          required={required}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* 3. Commune */}
        <SearchableDropdown
          label="Commune"
          icon={<Building className="w-3.5 h-3.5 text-brand-600" />}
          placeholder="Sélectionnez la commune"
          searchPlaceholder="Filtrer les communes..."
          options={communeOptions}
          selectedName={selectedCommune}
          onSelect={handleCommuneSelect}
          disabled={disabled || !selectedDepartment}
          disabledNotice="Sélectionnez d'abord un département"
          required={required}
        />

        {/* 4. Ville / Localité */}
        <SearchableDropdown
          label="Ville / Quartier / Localité"
          icon={<MapPin className="w-3.5 h-3.5 text-brand-600" />}
          placeholder="Sélectionnez la ville ou quartier"
          searchPlaceholder="Filtrer les localités..."
          options={cityOptions}
          selectedName={selectedCity}
          onSelect={handleCitySelect}
          disabled={disabled || !selectedCommune}
          disabledNotice="Sélectionnez d'abord une commune"
          required={required}
        />
      </div>
    </div>
  );
};
