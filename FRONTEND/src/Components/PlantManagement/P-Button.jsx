import React from 'react';
import './styles/P-Button.css';


const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  onClick,
  type = 'button',
  disabled = false,
  icon,
  className = ''
}) => {
  return <button type={type} className={`button ${variant} ${size} ${className}`} onClick={onClick} disabled={disabled}>
      {icon && <span className="button-icon">{icon}</span>}
      {children}
    </button>;
};
export default Button;