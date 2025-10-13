// This is a utility script to help update all inventory management pages with the new export functionality
// Run this script to see which pages need to be updated

const pagesToUpdate = [
  'FertilizerStock.jsx',
  'expiry.jsx', 
  'ISupplier.jsx',
  'Orders.jsx',
  'ExportMarket.jsx'
];

console.log('Pages that need export functionality updates:', pagesToUpdate);

// Common changes needed for each page:
const changesNeeded = {
  imports: `
import { exportToPDF, exportToExcel, getExportModalConfig, EXPORT_CONFIGS } from "../utils/exportUtils";
import { FileText, FileSpreadsheet } from "lucide-react";`,
  
  state: `
const [exportModal, setExportModal] = useState(getExportModalConfig('pageType'));`,
  
  exportFunction: `
// Export data function
const handleExport = () => {
  const dataToExport = exportModal.selection === 'current' ? filteredData : allData;
  
  if (dataToExport.length === 0) {
    setError("No data available to export");
    return;
  }

  const config = {
    ...EXPORT_CONFIGS.pageType,
    dataFormatter: (item) => {
      // Custom formatter for each page type
      return {
        // Map fields to display names
      };
    }
  };

  try {
    if (exportModal.format === 'excel') {
      exportToExcel(dataToExport, config);
      setSuccess("Excel file downloaded successfully!");
    } else {
      exportToPDF(dataToExport, config);
      setSuccess("PDF report downloaded successfully!");
    }
  } catch (error) {
    console.error("Export error:", error);
    setError("Failed to export data. Please try again.");
  }
  
  setExportModal({ ...exportModal, open: false });
};`,
  
  buttonUpdate: `
// Update download button onClick from exportToPDF to:
onClick={() => setExportModal({ ...exportModal, open: true })}`,
  
  modal: `
{/* Export Modal */}
{exportModal.open && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div className={\`rounded-xl shadow-2xl max-w-md w-full p-6 \${darkMode ? "bg-gray-800" : "bg-white"}\`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Download size={24} />
          Export Data
        </h2>
        <button
          onClick={() => setExportModal({ ...exportModal, open: false })}
          className={\`p-2 rounded-lg \${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}\`}
        >
          <X size={20} />
        </button>
      </div>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className={\`block text-sm font-medium mb-1.5 \${darkMode ? "text-gray-300" : "text-gray-700"}\`}>
            Export Format
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setExportModal({...exportModal, format: 'excel'})}
              className={\`p-3 rounded-lg border flex flex-col items-center justify-center \${
                exportModal.format === 'excel' 
                  ? 'border-green-500 bg-green-50 text-green-600' 
                  : darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'
              }\`}
            >
              <FileSpreadsheet size={24} />
              <span className="mt-1 text-sm">Excel</span>
            </button>
            <button
              onClick={() => setExportModal({...exportModal, format: 'pdf'})}
              className={\`p-3 rounded-lg border flex flex-col items-center justify-center \${
                exportModal.format === 'pdf' 
                  ? 'border-green-500 bg-green-50 text-green-600' 
                  : darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'
              }\`}
            >
              <FileText size={24} />
              <span className="mt-1 text-sm">PDF</span>
            </button>
          </div>
        </div>
        
        <div>
          <label className={\`block text-sm font-medium mb-1.5 \${darkMode ? "text-gray-300" : "text-gray-700"}\`}>
            Data Selection
          </label>
          <div className="space-y-2">
            <label className={\`flex items-center \${darkMode ? "text-gray-300" : "text-gray-700"}\`}>
              <input
                type="radio"
                name="selection"
                value="current"
                checked={exportModal.selection === 'current'}
                onChange={(e) => setExportModal({...exportModal, selection: e.target.value})}
                className="mr-2"
              />
              Current View ({filteredData.length} items)
            </label>
            <label className={\`flex items-center \${darkMode ? "text-gray-300" : "text-gray-700"}\`}>
              <input
                type="radio"
                name="selection"
                value="all"
                checked={exportModal.selection === 'all'}
                onChange={(e) => setExportModal({...exportModal, selection: e.target.value})}
                className="mr-2"
              />
              All Data ({allData.length} items)
            </label>
          </div>
        </div>
      </div>
      
      <div className="flex gap-3">
        <button
          onClick={() => setExportModal({ ...exportModal, open: false })}
          className={\`flex-1 px-4 py-2 rounded-lg \${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"} transition-all\`}
        >
          Cancel
        </button>
        <button
          onClick={handleExport}
          className={\`flex-1 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-all\`}
        >
          Export {exportModal.format.toUpperCase()}
        </button>
      </div>
    </div>
  </div>
)}`
};

console.log('Changes needed:', changesNeeded);
