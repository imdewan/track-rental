import React, { useState, useRef } from 'react';
import { UploadCloud } from 'lucide-react';

interface FileUploadProps {
  onChange: (file: File) => void;
  label?: string;
  accept?: string;
  maxSize?: number;
  error?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onChange,
  label = 'Upload a file',
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB default
  error,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [fileError, setFileError] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFile = (file: File): boolean => {
    if (!file.type.match(accept.replace('*', '.*'))) {
      setFileError('File type not accepted');
      return false;
    }
    
    if (file.size > maxSize) {
      setFileError(`File size cannot exceed ${Math.round(maxSize / 1024 / 1024)}MB`);
      return false;
    }
    
    setFileError('');
    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setFileName(file.name);
        onChange(file);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setFileName(file.name);
        onChange(file);
      }
    }
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div 
        className={`border-2 border-dashed rounded-md p-4 flex flex-col items-center justify-center cursor-pointer
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          onChange={handleChange}
        />
        <UploadCloud className="h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-500">
          <span className="text-blue-600 font-medium">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {accept.replace('*', '')} (Max {Math.round(maxSize / 1024 / 1024)}MB)
        </p>
        {fileName && (
          <div className="mt-2 text-sm text-gray-800 flex items-center">
            <span className="truncate max-w-xs">{fileName}</span>
          </div>
        )}
      </div>
      {(fileError || error) && (
        <p className="mt-1 text-sm text-red-600">{fileError || error}</p>
      )}
    </div>
  );
};

export default FileUpload;