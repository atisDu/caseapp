import React, { useState, useRef, useEffect } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { MapPin, Check } from 'lucide-react';
import { Language, t } from '../utils/translations';

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
  label?: string;
  id?: string;
  language: Language;
}

// Mock address suggestions - in a real app, you'd use Google Places API or similar
const MOCK_ADDRESSES = [
  '123 Main Street, New York, NY 10001',
  '456 Oak Avenue, Los Angeles, CA 90210',
  '789 Pine Road, Chicago, IL 60601',
  '321 Elm Street, Houston, TX 77001',
  '654 Maple Drive, Phoenix, AZ 85001',
  '987 Cedar Lane, Philadelphia, PA 19101',
  '147 Birch Court, San Antonio, TX 78201',
  '258 Willow Way, San Diego, CA 92101',
  '369 Spruce Street, Dallas, TX 75201',
  '741 Poplar Place, San Jose, CA 95101'
];

export function AddressAutocomplete({ 
  value, 
  onChange, 
  placeholder = "Enter your address", 
  label,
  id,
  language
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);

    if (inputValue.length > 2) {
      // Filter mock addresses based on input
      const filteredSuggestions = MOCK_ADDRESSES.filter(address =>
        address.toLowerCase().includes(inputValue.toLowerCase())
      ).slice(0, 5);
      
      setSuggestions(filteredSuggestions);
      setShowSuggestions(true);
      setActiveSuggestion(-1);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
    setActiveSuggestion(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestion(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestion(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (activeSuggestion >= 0 && activeSuggestion < suggestions.length) {
          handleSuggestionClick(suggestions[activeSuggestion]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setActiveSuggestion(-1);
        break;
    }
  };

  return (
    <div className="relative">
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          className="pr-10"
        />
        <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <Card 
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto shadow-lg"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`px-4 py-3 cursor-pointer border-b last:border-b-0 transition-colors ${
                index === activeSuggestion 
                  ? 'bg-accent text-accent-foreground' 
                  : 'hover:bg-muted'
              }`}
              onClick={() => handleSuggestionClick(suggestion)}
              onMouseEnter={() => setActiveSuggestion(index)}
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm">{suggestion}</span>
                {index === activeSuggestion && (
                  <Check className="w-4 h-4 text-primary ml-auto" />
                )}
              </div>
            </div>
          ))}
          
          {/* Info footer */}
          <div className="px-4 py-2 text-xs text-muted-foreground bg-muted/50 border-t">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{t(language, 'useArrowKeys')}</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}