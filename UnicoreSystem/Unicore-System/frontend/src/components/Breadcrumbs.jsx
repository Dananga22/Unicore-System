import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';

const Breadcrumbs = ({ items = [], showBack = true }) => {
  const navigate = useNavigate();

  if (!items || items.length === 0) return null;

  return (
    <nav className="breadcrumbs-container animate-fade" aria-label="Breadcrumb">
      <div className="flex items-center gap-4">
        {showBack && (
          <button 
            onClick={() => navigate(-1)}
            className="breadcrumb-back-btn"
            title="Go Back"
          >
            <ArrowLeft size={16} />
          </button>
        )}
        
        <ol className="breadcrumb-list">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            
            return (
              <li key={index} className="breadcrumb-item">
                {index > 0 && (
                  <ChevronRight size={14} className="breadcrumb-separator" />
                )}
                
                {isLast || !item.path ? (
                  <span className="breadcrumb-active">
                    {item.label}
                  </span>
                ) : (
                  <Link to={item.path} className="breadcrumb-link">
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
};

export default Breadcrumbs;
