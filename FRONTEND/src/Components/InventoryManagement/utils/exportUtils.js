import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Company information constants
const COMPANY_INFO = {
  name: "Mount Olive Farm House",
  address: "No. 45, Green Valley Road, Boragasketiya, Nuwaraeliya, Sri Lanka",
  contact: "Phone: +94 81 249 2134 | Email: info@mountolivefarm.com",
  website: "www.mountolivefarm.com"
};

// Professional color scheme
const COLORS = {
  primary: [34, 197, 94], // Green
  secondary: [16, 185, 129], // Teal
  accent: [59, 130, 246], // Blue
  text: [31, 41, 55], // Dark gray
  lightGray: [243, 244, 246]
};

/**
 * Export data to PDF with professional styling and company branding
 * @param {Array} data - Array of objects to export
 * @param {Object} config - Configuration object
 * @param {string} config.reportTitle - Title of the report
 * @param {Array} config.headers - Column headers
 * @param {Array} config.fields - Field names to extract from data objects
 * @param {string} config.fileName - Base name for the file
 * @param {Function} config.dataFormatter - Optional function to format data rows
 */
export const exportToPDF = async (data, config) => {
  try {
    if (!data || data.length === 0) {
      throw new Error("No data available to export to PDF.");
    }

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const reportDate = new Date().toLocaleDateString();
    const reportTime = new Date().toLocaleTimeString();

    // Add company logo
    try {
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      logoImg.onload = () => {
        doc.addImage(logoImg, 'PNG', 15, 10, 20, 20);
        generatePDFContent();
      };
      logoImg.onerror = () => {
        // Fallback to placeholder if logo fails to load
        doc.setFillColor(...COLORS.primary);
        doc.rect(15, 10, 20, 20, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('MOF', 22, 22, { align: 'center' });
        generatePDFContent();
      };
      logoImg.src = '/logo512.png';
    } catch (error) {
      console.error('Error loading logo:', error);
      // Fallback to placeholder
      doc.setFillColor(...COLORS.primary);
      doc.rect(15, 10, 20, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('MOF', 22, 22, { align: 'center' });
      generatePDFContent();
    }

    const generatePDFContent = () => {
      // Company header
      doc.setTextColor(...COLORS.text);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(COMPANY_INFO.name, 40, 15);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(COMPANY_INFO.address, 40, 20);
      doc.text(COMPANY_INFO.contact, 40, 24);

      // Report title with professional styling
      doc.setFillColor(...COLORS.lightGray);
      doc.rect(15, 30, 270, 10, 'F');
      doc.setTextColor(...COLORS.primary);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`${config.reportTitle.toUpperCase()} REPORT`, 150, 37, { align: 'center' });

      // Report metadata
      doc.setTextColor(...COLORS.text);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${reportDate} at ${reportTime}`, 15, 45);
      doc.text(`Total Records: ${data.length}`, 15, 50);

      // Prepare table data
      let tableData;
      
      if (config.dataFormatter) {
        try {
          // Convert objects to arrays for autoTable
          const formattedData = data.map(config.dataFormatter);
          
          tableData = formattedData.map(obj => {
            if (!obj || typeof obj !== 'object') {
              return config.headers.map(() => 'N/A');
            }
            return config.headers.map(header => {
              const value = obj[header];
              return value !== undefined && value !== null ? String(value) : '-';
            });
          });
        } catch (error) {
          console.error('Error in data formatter:', error);
          // Fallback to basic formatting
          tableData = data.map(row => 
            config.fields.map(field => {
              // Handle nested properties (e.g., 'stock.quantity')
              const value = field.includes('.') 
                ? field.split('.').reduce((obj, key) => obj && obj[key], row)
                : row[field];
              return value !== undefined && value !== null ? String(value) : '-';
            })
          );
        }
      } else {
        tableData = data.map(row => 
          config.fields.map(field => {
            // Handle nested properties (e.g., 'stock.quantity')
            const value = field.includes('.') 
              ? field.split('.').reduce((obj, key) => obj && obj[key], row)
              : row[field];
            return value !== undefined && value !== null ? String(value) : '-';
          })
        );
      }

      // Create table
      autoTable(doc, {
        head: [config.headers],
        body: tableData,
        startY: 55,
        theme: 'grid',
        headStyles: {
          fillColor: COLORS.primary,
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 10,
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 9,
          halign: 'center',
          valign: 'middle',
          overflow: 'linebreak'
        },
        columnStyles: {},
        margin: { top: 55 },
        styles: {
          overflow: 'linebreak',
          cellPadding: 3
        }
      });

      // Professional footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Footer background
        doc.setFillColor(...COLORS.lightGray);
        doc.rect(0, 195, 297, 15, 'F');
        
        // Footer content
        doc.setTextColor(...COLORS.text);
        doc.setFontSize(8);
        doc.text(`Page ${i} of ${pageCount}`, 15, 202);
        doc.text(`Generated on ${new Date().toLocaleString()}`, 148, 202, { align: 'center' });
        doc.text(COMPANY_INFO.name, 282, 202, { align: 'right' });
        
        // Footer line
        doc.setDrawColor(...COLORS.primary);
        doc.setLineWidth(0.5);
        doc.line(15, 204, 282, 204);
        
        // Disclaimer
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(7);
        doc.text("This report is generated by Mount Olive Farm House Management System", 148, 208, { align: 'center' });
      }

      // Save PDF with professional naming
      const fileName = `MOF_${config.fileName}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    };

  } catch (error) {
    console.error("Error exporting to PDF:", error);
    throw error;
  }
};

/**
 * Export data to Excel with professional formatting
 * @param {Array} data - Array of objects to export
 * @param {Object} config - Configuration object
 * @param {Array} config.headers - Column headers
 * @param {Array} config.fields - Field names to extract from data objects
 * @param {string} config.fileName - Base name for the file
 * @param {string} config.sheetName - Name for the worksheet
 * @param {Function} config.dataFormatter - Optional function to format data rows
 */
export const exportToExcel = (data, config) => {
  try {
    if (!data || data.length === 0) {
      throw new Error("No data available to export to Excel.");
    }

    // Prepare data for Excel
    const worksheetData = data.map(row => {
      if (config.dataFormatter) {
        return config.dataFormatter(row);
      } else {
        const rowData = {};
        config.fields.forEach((field, index) => {
          // Handle nested properties (e.g., 'stock.quantity')
          const value = field.includes('.') 
            ? field.split('.').reduce((obj, key) => obj && obj[key], row)
            : row[field];
          rowData[config.headers[index]] = value !== undefined && value !== null ? value : '-';
        });
        return rowData;
      }
    });

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    
    // Set column widths
    const colWidths = config.headers.map(() => ({ wch: 20 }));
    worksheet['!cols'] = colWidths;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, config.sheetName || 'Data');
    
    // Generate Excel file and trigger download
    const fileName = `MOF_${config.fileName}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

  } catch (error) {
    console.error("Error exporting to Excel:", error);
    throw error;
  }
};

/**
 * Get standardized export modal configuration
 */
export const getExportModalConfig = (reportType) => {
  return {
    open: false,
    format: 'excel',
    selection: 'current', // 'current' or 'all'
    includeQR: false,
    reportType: reportType
  };
};

/**
 * Common export configurations for different report types
 */
export const EXPORT_CONFIGS = {
  inventoryStock: {
    reportTitle: 'Inventory Stock',
    fileName: 'Inventory_Stock',
    headers: ['Product Name', 'Category', 'Stock Quantity', 'Unit', 'Price', 'Market', 'Expiry Date', 'Status'],
    fields: ['name', 'category', 'stock.quantity', 'stock.unit', 'price', 'market', 'expiryDate', 'status'],
    sheetName: 'Inventory Stock'
  },
  animalFoodStock: {
    reportTitle: 'Animal Food Stock',
    fileName: 'Animal_Food_Stock',
    headers: ['Food Name', 'Quantity', 'Remaining', 'Unit', 'Target Animal', 'Shelf Life', 'Expiry Date', 'Status'],
    fields: ['name', 'quantity', 'remaining', 'unit', 'targetAnimal', 'shelfLife', 'expiryDate', 'status'],
    sheetName: 'Animal Food Stock'
  },
  fertilizerStock: {
    reportTitle: 'Fertilizer Stock',
    fileName: 'Fertilizer_Stock',
    headers: ['Fertilizer Name', 'Quantity', 'Remaining', 'Unit', 'Type', 'Expiry Date', 'Status'],
    fields: ['name', 'quantity', 'remaining', 'unit', 'fertilizerType', 'expiryDate', 'status'],
    sheetName: 'Fertilizer Stock'
  },
  expiryReport: {
    reportTitle: 'Product Expiry',
    fileName: 'Product_Expiry_Report',
    headers: ['Product Name', 'Category', 'Current Stock', 'Expiry Date', 'Days Until Expiry', 'Status'],
    fields: ['name', 'category', 'stock.quantity', 'expiryDate', 'daysUntilExpiry', 'status'],
    sheetName: 'Expiry Report'
  },
  supplierReport: {
    reportTitle: 'Supplier Directory',
    fileName: 'Supplier_Directory',
    headers: ['Supplier Name', 'Company', 'Type', 'Email', 'Phone', 'Website', 'Address', 'Products', 'Rating'],
    fields: ['name', 'company', 'type', 'email', 'phone', 'website', 'address', 'products', 'rating'],
    sheetName: 'Suppliers'
  },
  ordersReport: {
    reportTitle: 'Orders',
    fileName: 'Orders_Report',
    headers: ['Order ID', 'Product', 'Quantity', 'Supplier', 'Order Date', 'Status', 'Total Amount'],
    fields: ['orderId', 'product', 'quantity', 'supplier', 'orderDate', 'status', 'totalAmount'],
    sheetName: 'Orders'
  },
  exportMarket: {
    reportTitle: 'Export Market',
    fileName: 'Export_Market_Report',
    headers: ['Product', 'Destination', 'Quantity', 'Export Date', 'Status', 'Revenue'],
    fields: ['product', 'destination', 'quantity', 'exportDate', 'status', 'revenue'],
    sheetName: 'Export Market'
  }
};
