// components/findwork/FilterSection.tsx
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Bookmark, CheckCircle, Briefcase } from 'lucide-react';
import { CountryOption } from '@/types/findwork';

interface FilterSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCountry: string;
  setSelectedCountry: (country: string) => void;
  countries: CountryOption[];
  showOnlySaved: boolean;
  toggleSavedFilter: () => void;
  showMyPostingsOnly: boolean;
  toggleMyPostingsFilter: () => void;
  clearFilters: () => void;
  isContentCreator: boolean;
  isBusinessOwner: boolean;
  myPostingsCount: number;
  filteredCount: number;
  totalCount: number;
}

export function FilterSection({
  searchQuery,
  setSearchQuery,
  selectedCountry,
  setSelectedCountry,
  countries,
  showOnlySaved,
  toggleSavedFilter,
  showMyPostingsOnly,
  toggleMyPostingsFilter,
  clearFilters,
  isContentCreator,
  isBusinessOwner,
  myPostingsCount,
  filteredCount,
  totalCount,
}: FilterSectionProps) {
  return (
    <div className="mb-6 bg-white p-6 rounded-lg shadow-sm">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search bar */}
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search job title, description, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Country filter */}
        <div className="w-full md:w-64">
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-9 px-3"
          >
            <option value="">All Countries</option>
            {countries.map((country) => (
              <option key={country.code} value={country.name}>
                {country.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Second row for filters */}
      <div className="flex flex-wrap items-center mt-4 gap-2">
        {/* Saved Jobs Filter for Content Creators */}
        {isContentCreator && (
          <Button
            onClick={toggleSavedFilter}
            variant={showOnlySaved ? 'default' : 'outline'}
            className="flex items-center gap-1"
            size="sm"
          >
            {showOnlySaved ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
            {showOnlySaved ? 'Showing Saved Jobs' : 'Show Saved Jobs'}
          </Button>
        )}

        {/* My Postings Filter for Business Owners */}
        {isBusinessOwner && (
          <Button
            onClick={toggleMyPostingsFilter}
            variant={showMyPostingsOnly ? 'default' : 'outline'}
            className="flex items-center gap-1"
            size="sm"
          >
            {showMyPostingsOnly ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <Briefcase className="h-4 w-4" />
            )}
            {showMyPostingsOnly ? 'Showing My Postings' : 'My Postings'} (
            {myPostingsCount})
          </Button>
        )}

        {/* Clear filters button - only show if filters are active */}
        {(selectedCountry ||
          searchQuery ||
          showOnlySaved ||
          showMyPostingsOnly) && (
          <Button
            variant="outline"
            onClick={clearFilters}
            className="flex items-center gap-1"
            size="sm"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
        )}

        {/* Filter stats */}
        <div className="text-sm text-gray-500 ml-auto">
          Showing {filteredCount} of {totalCount} job postings
          {selectedCountry && ` in ${selectedCountry}`}
          {searchQuery && ` matching "${searchQuery}"`}
          {showOnlySaved && ` you've saved`}
          {showMyPostingsOnly && ` you've created`}
        </div>
      </div>
    </div>
  );
}
