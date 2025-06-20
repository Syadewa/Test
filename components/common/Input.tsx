
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
  labelClassName?: string;
  rightAddon?: React.ReactNode;
  rightAddonSameLine?: boolean;
  leftIcon?: string; 
}

const Input: React.FC<InputProps> = ({ 
  label, 
  id, 
  error, 
  className = '', 
  containerClassName = '', 
  labelClassName = '', 
  rightAddon,
  rightAddonSameLine,
  leftIcon,
  ...props 
}) => {
  const baseStructuralClasses = `border rounded-md shadow-sm focus:outline-none sm:text-sm`;
  const errorClasses = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-smkn-blue focus:ring-smkn-blue';
  const focusClasses = `focus:ring-1`; // Simplified focus, as specific color is in errorClasses or normal state

  const inputThemeClasses = [
    className.includes('bg-') ? '' : 'bg-white', // Don't override if bg- is already there
    className.includes('text-') ? '' : 'text-gray-900',
    className.includes('placeholder-') ? '' : 'placeholder-gray-400',
  ].filter(Boolean).join(' ');

  const defaultLabelClass = "block text-sm font-medium mb-1";
  const finalLabelClassName = `${defaultLabelClass} ${containerClassName.includes('text-gray-300') ? 'text-gray-300' : 'text-gray-700'} ${labelClassName}`;

  let inputField;

  const coreInputClasses = `relative block w-full outline-none ${leftIcon ? 'pl-10' : 'px-3'} py-2 ${inputThemeClasses}`;

  if (rightAddon && rightAddonSameLine) {
    const groupStructuralClasses = `flex items-stretch ${baseStructuralClasses} ${errorClasses} ${focusClasses} ${className.replace(/border-\S+/g, '').replace(/rounded-\S+/g, '').replace(/focus:\S+/g, '')}`;
    
    const inputGroupMemberClasses = `${coreInputClasses.replace('px-3', '')} rounded-none border-0 focus:ring-0`; // Remove individual border/rounding/focus for grouped input

    inputField = (
      <div className={`${groupStructuralClasses.trim()} focus-within:ring-1 ${error ? 'focus-within:ring-red-500' : 'focus-within:ring-smkn-blue'}`}>
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
            <i className={`${leftIcon} text-gray-400`}></i>
          </div>
        )}
        <input
          id={id}
          className={`${inputGroupMemberClasses} ${className.replace(/border-\S+/g, '').replace(/rounded-\S+/g, '').replace(/focus:\S+/g, '')}`}
          {...props}
        />
        <div className="flex-shrink-0 flex items-center justify-center">
          {rightAddon}
        </div>
      </div>
    );
  } else {
    const finalInputClassName = `${coreInputClasses} ${baseStructuralClasses} ${errorClasses} ${focusClasses} ${className}`;
    inputField = (
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
            <i className={`${leftIcon} text-gray-400`}></i>
          </div>
        )}
        <input
          id={id}
          className={finalInputClassName.trim()}
          {...props}
        />
         {rightAddon && !rightAddonSameLine && <div className="absolute inset-y-0 right-0 pr-3 flex items-center">{rightAddon}</div>}
      </div>
    );
     // This is a simplified version if rightAddon is not same line and there's no left icon.
     // If both leftIcon and a non-same-line rightAddon are needed, the layout logic might need more nesting.
     // For now, assuming non-same-line rightAddon is simpler or won't overlap with a left icon in typical use.
     if (rightAddon && !rightAddonSameLine && !leftIcon) { // Simplified for this case
        inputField = (
             <div className="flex items-center">
                <input id={id} className={`${coreInputClasses} ${baseStructuralClasses} ${errorClasses} ${focusClasses} ${className} flex-grow`} {...props} />
                <div className="ml-2 flex-shrink-0">{rightAddon}</div>
            </div>
        );
     }
  }


  return (
    <div className={`mb-4 ${containerClassName}`}>
      {label && (
        <label htmlFor={id} className={finalLabelClassName.trim()}>
          {label}
        </label>
      )}
      {inputField}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};


interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
  labelClassName?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ label, id, error, className = '', containerClassName = '', labelClassName = '', ...props }) => {
  const structuralClasses = `block w-full px-3 py-2 border ${
    error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-smkn-blue focus:ring-smkn-blue'
  } rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm`;

  const themeClasses = [
    className.includes('bg-') ? '' : 'bg-white',
    className.includes('text-') ? '' : 'text-gray-900',
    className.includes('placeholder-') ? '' : 'placeholder-gray-400',
  ].filter(Boolean).join(' ');
  
  const finalTextareaClassName = `${structuralClasses} ${themeClasses} ${className}`;
  const defaultLabelClass = "block text-sm font-medium mb-1";
  const finalLabelClassName = `${defaultLabelClass} ${containerClassName.includes('text-gray-300') ? 'text-gray-300' : 'text-gray-700'} ${labelClassName}`;

  return (
    <div className={`mb-4 ${containerClassName}`}>
      {label && (
        <label htmlFor={id} className={finalLabelClassName.trim()}>
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={finalTextareaClassName.trim()}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};


interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
  labelClassName?: string;
  options: { value: string | number; label: string }[];
  leftIcon?: string;
}

export const Select: React.FC<SelectProps> = ({ label, id, error, options, className = '', containerClassName = '', labelClassName = '', leftIcon, ...props }) => {
  const structuralClasses = `block w-full border ${
    error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-smkn-blue focus:ring-smkn-blue'
  } rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${leftIcon ? 'pl-10' : 'px-3'} py-2`;
  
  const themeClasses = [
    className.includes('bg-') ? '' : 'bg-white',
    className.includes('text-') ? '' : 'text-gray-900',
  ].filter(Boolean).join(' ');

  const finalSelectClassName = `${structuralClasses} ${themeClasses} ${className}`;
  const defaultLabelClass = "block text-sm font-medium mb-1";
  const finalLabelClassName = `${defaultLabelClass} ${containerClassName.includes('text-gray-300') ? 'text-gray-300' : 'text-gray-700'} ${labelClassName}`;


  return (
    <div className={`mb-4 ${containerClassName}`}>
      {label && (
        <label htmlFor={id} className={finalLabelClassName.trim()}>
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <i className={`${leftIcon} text-gray-400`}></i>
            </div>
        )}
        <select
            id={id}
            className={finalSelectClassName.trim()}
            {...props}
        >
            <option value="" className="text-gray-500">Pilih...</option>
            {options.map(option => (
            <option key={option.value} value={option.value} className="text-gray-900 bg-white">{option.label}</option>
            ))}
        </select>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default Input;
