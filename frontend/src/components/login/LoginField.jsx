import Icon from './icons';

/** Labeled login input with a leading icon and optional trailing control / label-row extra. */
export default function LoginField({ id, label, icon, trailing, labelAside, ...inputProps }) {
  const classes = ['login-input', icon && 'has-icon', trailing && 'has-trailing'].filter(Boolean).join(' ');
  return (
    <div className="login-field">
      <div className="login-field__label-row">
        <label htmlFor={id}>{label}</label>
        {labelAside}
      </div>
      <div className="login-field__control">
        {icon && <span className="login-field__icon"><Icon name={icon} size={15} /></span>}
        <input id={id} className={classes} {...inputProps} />
        {trailing}
      </div>
    </div>
  );
}
