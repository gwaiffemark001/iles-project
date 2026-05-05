import React from 'react';

const Layout = ({ children }) => {
  return (
    <div className="layout-container">
      {/* You can add a Navbar or Sidebar here later */}
      <main>
        {children}
      </main>
    </div>
  );
};

export default Layout;

// Comment for Layout.jsx