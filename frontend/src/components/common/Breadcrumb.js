import React from 'react';
import { Link } from 'react-router-dom';
import { IoChevronForward } from 'react-icons/io5';

export const Breadcrumb = ({ items = [] }) => {
  return (
    <nav className="flex items-center gap-2 mb-4">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          {item.href ? (
            <Link to={item.href} className="text-primary hover:underline font-medium text-sm">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-600 font-medium text-sm">{item.label}</span>
          )}
          {idx < items.length - 1 && <IoChevronForward className="text-gray-400" />}
        </div>
      ))}
    </nav>
  );
};
