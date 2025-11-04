import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, FunnelIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { PROGRAM_CATEGORIES } from '../../types/academic';

interface FilterOptions {
  category: string;
  status: string;
  search: string;
}

interface ActionToolbarProps {
  onAddNew?: () => void;
  onFilterChange: (filters: FilterOptions) => void;
  totalCount: number;
  filteredCount: number;
  isLoading?: boolean;
}

export default function ActionToolbar({
  onAddNew,
  onFilterChange,
  totalCount,
  filteredCount,
  isLoading = false
}: ActionToolbarProps) {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FilterOptions>({
    category: '',
    status: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = { category: '', status: '', search: '' };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
    setShowFilters(false);
  };

  const hasActiveFilters = filters.category || filters.status || filters.search;

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      {/* Main Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left Section - Search and Filters */}
        <div className="flex flex-1 items-center space-x-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search programs..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              disabled={isLoading}
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium transition-colors ${
              hasActiveFilters
                ? 'text-blue-700 bg-blue-50 border-blue-300'
                : 'text-gray-700 bg-white hover:bg-gray-50'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            disabled={isLoading}
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {[filters.category, filters.status, filters.search].filter(Boolean).length}
              </span>
            )}
          </button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              disabled={isLoading}
            >
              Clear all
            </button>
          )}
        </div>

        {/* Right Section - Add Button and Count */}
        <div className="flex items-center space-x-4">
          {/* Results Count */}
          <div className="text-sm text-gray-500">
            {filteredCount === totalCount ? (
              <span>{totalCount} program{totalCount !== 1 ? 's' : ''}</span>
            ) : (
              <span>
                {filteredCount} of {totalCount} program{totalCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Add New Button */}
          <button
            onClick={onAddNew || (() => navigate('/admin/academics/new'))}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add New Program
          </button>
        </div>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="category-filter"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                disabled={isLoading}
              >
                <option value="">All Categories</option>
                {PROGRAM_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status-filter"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                disabled={isLoading}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-end">
              <button
                onClick={() => setShowFilters(false)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                disabled={isLoading}
              >
                <XMarkIcon className="h-4 w-4 mr-2" />
                Hide Filters
              </button>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="mt-3 flex flex-wrap gap-2">
              {filters.search && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Search: "{filters.search}"
                  <button
                    onClick={() => handleFilterChange('search', '')}
                    className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:text-blue-600 hover:bg-blue-200"
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.category && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Category: {PROGRAM_CATEGORIES.find(c => c.value === filters.category)?.label}
                  <button
                    onClick={() => handleFilterChange('category', '')}
                    className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-green-400 hover:text-green-600 hover:bg-green-200"
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.status && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Status: {filters.status === 'active' ? 'Active' : 'Inactive'}
                  <button
                    onClick={() => handleFilterChange('status', '')}
                    className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-purple-400 hover:text-purple-600 hover:bg-purple-200"
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}