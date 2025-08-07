
import { FiX, FiDownload } from 'react-icons/fi';
import AuthenticatedImage from './AuthenticatedImage';

interface PhotoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: {
    public_id: string;
    original_name: string;
    azure_url: string;
  } | null;
  onDownload?: () => void;
}

export default function PhotoPreviewModal({ isOpen, onClose, file, onDownload }: PhotoPreviewModalProps) {
  if (!isOpen || !file) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative max-w-4xl max-h-full bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900 truncate pr-4">
            {file.original_name}
          </h3>
          <div className="flex items-center gap-2">
            {onDownload && (
              <button
                onClick={onDownload}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-colors"
                title="Download"
              >
                <FiDownload size={20} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-full transition-colors"
              title="Close"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* Image */}
        <div className="p-4">
          <AuthenticatedImage
            src={`/api/serve-file/${file.public_id}`}
            alt={file.original_name}
            className="max-w-full max-h-[70vh] object-contain mx-auto"
            fallback={
              <div className="w-full h-64 bg-gray-200 flex items-center justify-center text-gray-500">
                Failed to load image
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}
