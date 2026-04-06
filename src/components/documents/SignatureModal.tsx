import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { FileSignature, X, RotateCcw, CheckCircle } from 'lucide-react';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signatureData: string) => void;
}

const SignatureModal: React.FC<SignatureModalProps> = ({ isOpen, onClose, onSave }) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleClear = () => {
    sigCanvas.current?.clear();
    setError('');
  };

  const handleSave = () => {
    if (sigCanvas.current?.isEmpty()) {
      setError('Please draw a signature before saving.');
      return;
    }
    setError('');
    const dataURL = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
    if (dataURL) {
      onSave(dataURL);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800 scale-100 transition-all">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center space-x-2">
            <FileSignature className="w-6 h-6 text-blue-600" />
            <span>Digital E-Signature</span>
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 bg-gray-50 dark:bg-gray-900/50">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 font-medium">
            Please draw your signature below to authorize the document:
          </p>
          
          <div className="bg-white dark:bg-gray-100 rounded-2xl overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-400 shadow-inner relative group touch-none">
            <SignatureCanvas 
              ref={sigCanvas}
              penColor="black"
              canvasProps={{
                className: 'w-full h-64 cursor-crosshair touch-none',
                style: { width: '100%', height: '256px' }
              }}
            />
            <div className="absolute bottom-8 left-10 right-10 flex flex-col items-center pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity">
              <div className="w-full h-px bg-gray-400"></div>
              <span className="text-xs text-gray-400 mt-1 uppercase font-bold tracking-widest">Sign Here</span>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-3 flex items-center"><X className="w-4 h-4 mr-1"/> {error}</p>}
        </div>

        <div className="px-6 py-5 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex justify-between items-center">
          <button 
            onClick={handleClear}
            className="flex items-center space-x-2 px-4 py-2.5 text-red-600 dark:text-red-500 font-semibold hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Clear</span>
          </button>
          
          <div className="flex space-x-3">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95"
            >
              <span>Save & Sign</span>
              <CheckCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignatureModal;
