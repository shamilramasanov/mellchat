import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header__content">
        <h1 className="header__title">MellChat</h1>
        <div className="header__actions">
          <button className="header__action" aria-label="Настройки">
            ⚙️
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

