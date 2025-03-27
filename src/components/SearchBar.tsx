import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building2, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Organisation, Contact } from '../lib/types';

interface SearchResult {
  id: string;
  name: string;
  type: 'organisation' | 'contact';
  subtitle?: string;
}

export function SearchBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchItems = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const searchTerm = `%${query}%`;

        // Search organisations
        const { data: organisations } = await supabase
          .from('organisations')
          .select('id, name, website')
          .ilike('name', searchTerm)
          .limit(5);

        // Search contacts
        const { data: contacts } = await supabase
          .from('contacts')
          .select(`
            id,
            name,
            role,
            organisation:organisations(name)
          `)
          .ilike('name', searchTerm)
          .limit(5);

        const formattedResults: SearchResult[] = [
          ...(organisations?.map(org => ({
            id: org.id,
            name: org.name,
            type: 'organisation' as const
          })) || []),
          ...(contacts?.map(contact => ({
            id: contact.id,
            name: contact.name,
            type: 'contact' as const,
            subtitle: contact.organisation?.name || contact.role
          })) || [])
        ];

        setResults(formattedResults);
      } catch (error) {
        console.error('Error searching:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimeout = setTimeout(searchItems, 300);
    return () => clearTimeout(debounceTimeout);
  }, [query]);

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    
    if (result.type === 'organisation') {
      navigate('/organisations', { state: { selectedOrganisationId: result.id } });
    } else {
      navigate('/contacts', { state: { selectedContactId: result.id } });
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="Search organisations or contacts..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
          {results.map((result) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => handleResultClick(result)}
              className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors text-left"
            >
              {result.type === 'organisation' ? (
                <Building2 className="h-5 w-5 text-exodus-fruit" />
              ) : (
                <User className="h-5 w-5 text-fade-green" />
              )}
              <div>
                <div className="font-medium text-gray-900">{result.name}</div>
                {result.subtitle && (
                  <div className="text-sm text-gray-500">{result.subtitle}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && query && results.length === 0 && !loading && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-4 text-center text-gray-500">
          No results found
        </div>
      )}
    </div>
  );
}