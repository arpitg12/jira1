import React from 'react';

export const InputField = ({ label, type = 'text', placeholder, error, required = false, ...props }) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-dark mb-1">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        className={`w-full border outline-none transition-colors ${
          error
            ? 'border-danger focus:border-danger focus:ring-2 focus:ring-red-200'
            : 'border-gray-300 focus:border-primary focus:ring-2 focus:ring-blue-200'
        }`}
        {...props}
      />
      {error && <p className="text-danger text-sm mt-1">{error}</p>}
    </div>
  );
};

export const TextArea = ({ label, placeholder, error, required = false, rows = 4, ...props }) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-dark mb-1">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <textarea
        placeholder={placeholder}
        rows={rows}
        className={`w-full border outline-none transition-colors ${
          error
            ? 'border-danger focus:border-danger focus:ring-2 focus:ring-red-200'
            : 'border-gray-300 focus:border-primary focus:ring-2 focus:ring-blue-200'
        }`}
        {...props}
      />
      {error && <p className="text-danger text-sm mt-1">{error}</p>}
    </div>
  );
};

export const Select = ({ label, options = [], error, required = false, ...props }) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-dark mb-1">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <select
        className={`w-full border outline-none transition-colors ${
          error
            ? 'border-danger focus:border-danger focus:ring-2 focus:ring-red-200'
            : 'border-gray-300 focus:border-primary focus:ring-2 focus:ring-blue-200'
        }`}
        {...props}
      >
        <option value="">Select an option</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-danger text-sm mt-1">{error}</p>}
    </div>
  );
};
