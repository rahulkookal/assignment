import React, { useState } from 'react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import { pdfjs } from 'react-pdf';

const PdfViewer = ({ pdfFiles }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(null);

  const handleLoadSuccess = ({ numPages }) => {
    setTotalPages(numPages);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div>
      {pdfFiles.map((pdfFile, index) => (
        <div key={index} className="pdf-container">
          <h2>PDF {index + 1}</h2>
          <Worker workerUrl={`https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`}>
            <Viewer fileUrl={pdfFile} onLoadSuccess={handleLoadSuccess} />
          </Worker>
          <p>
            Page {currentPage} of {totalPages}
          </p>
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
            Previous Page
          </button>
          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
            Next Page
          </button>
        </div>
      ))}
    </div>
  );
};

export default PdfViewer;
