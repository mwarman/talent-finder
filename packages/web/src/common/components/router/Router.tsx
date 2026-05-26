import { JSX } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { DocumentsPage } from '@/pages/documents/DocumentsPage';
import { SearchPage } from '@/pages/search/SearchPage';

/**
 * The Router component defines the routing structure of the application using React Router.
 * It sets up the routes for the DocumentsPage and SearchPage components.
 *
 * @returns {JSX.Element} The Router component with defined routes.
 */
export const Router = (): JSX.Element => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/documents" replace />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/search" element={<SearchPage />} />
      </Routes>
    </BrowserRouter>
  );
};
