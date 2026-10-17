/* ==========================================================================
   UI ARC - FILE UPLOAD BLOCK
   A complete file selection flow with constraints, progress, and error feedback.
   Supports drag & drop, file type/size validation, progress bar, retry, and abort.
   ========================================================================== */

import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, File, CheckCircle2, AlertCircle, RefreshCw, X, Trash2 } from 'lucide-react';

export function FileUpload({
  accept = 'image/*,.pdf',
  maxSize = 10 * 1024 * 1024, // 10MB
  multiple = true,
  disabled = false,
  label = 'Upload files',
  description = 'Drop files here or browse from your device.',
  value = [],
  onChange,
  onUpload,
  className = '',
  style = {}
}) {
  const [items, setItems] = useState(value);
  const [isDragging, setIsDragging] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const inputRef = useRef(null);
  const abortControllersRef = useRef({});

  // Sync controlled value
  useEffect(() => {
    if (value && value.length > 0) setItems(value);
  }, [value]);

  const updateItems = (newItems) => {
    setItems(newItems);
    if (onChange) onChange(newItems);
  };

  const handleFiles = async (fileList) => {
    if (disabled || !fileList.length) return;
    const addedFiles = Array.from(fileList);

    const newItems = addedFiles.map((file) => {
      const id = `file_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      let error = null;

      // Validation 1: Size check
      if (maxSize && file.size > maxSize) {
        error = `File exceeds max size (${Math.round(maxSize / (1024 * 1024))}MB)`;
      }

      // Validation 2: MIME/extension check
      if (accept) {
        const acceptedTypes = accept.split(',').map((t) => t.trim().toLowerCase());
        const ext = `.${file.name.split('.').pop().toLowerCase()}`;
        const isMimeMatch = acceptedTypes.some((t) => {
          if (t.endsWith('/*')) {
            const prefix = t.slice(0, -2);
            return file.type.toLowerCase().startsWith(prefix);
          }
          return t === ext || t === file.type.toLowerCase();
        });

        if (!isMimeMatch) {
          error = 'File type not accepted';
        }
      }

      return {
        id,
        file,
        name: file.name,
        size: file.size,
        progress: error ? 0 : 0,
        status: error ? 'error' : 'uploading',
        error
      };
    });

    const combined = multiple ? [...items, ...newItems] : newItems;
    updateItems(combined);
    setStatusMessage(`Added ${newItems.length} file(s).`);

    // Process uploads for valid files
    newItems.forEach((item) => {
      if (!item.error) {
        startUpload(item);
      }
    });
  };

  const startUpload = async (item) => {
    const controller = new AbortController();
    abortControllersRef.current[item.id] = controller;

    try {
      if (onUpload) {
        await onUpload(item.file, {
          onProgress: (percent) => {
            setItems((prev) =>
              prev.map((i) => (i.id === item.id ? { ...i, progress: percent } : i))
            );
          },
          signal: controller.signal
        });
      } else {
        // Built-in simulated progress if no external handler provided
        for (let p = 0; p <= 100; p += 20) {
          if (controller.signal.aborted) return;
          await new Promise((r) => setTimeout(r, 120));
          setItems((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, progress: p } : i))
          );
        }
      }

      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'complete', progress: 100 } : i))
      );
      setStatusMessage(`${item.name} uploaded successfully.`);
    } catch (err) {
      if (!controller.signal.aborted) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: 'error', error: err.message || 'Upload failed' } : i
          )
        );
        setStatusMessage(`Failed to upload ${item.name}.`);
      }
    } finally {
      delete abortControllersRef.current[item.id];
    }
  };

  const removeItem = (id) => {
    if (abortControllersRef.current[id]) {
      abortControllersRef.current[id].abort();
      delete abortControllersRef.current[id];
    }
    const filtered = items.filter((i) => i.id !== id);
    updateItems(filtered);
    setStatusMessage('File removed.');
  };

  const retryItem = (item) => {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: 'uploading', error: null, progress: 0 } : i))
    );
    startUpload(item);
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className={`arc-file-upload ${className}`} style={{ width: '100%', ...style }}>
      {/* Live Region for Screen Readers */}
      <div role="status" aria-live="polite" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
        {statusMessage}
      </div>

      {/* Dropzone Container */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-describedby="file-upload-desc"
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (!disabled && e.dataTransfer.files) {
            handleFiles(e.dataTransfer.files);
          }
        }}
        style={{
          border: `2px dashed ${isDragging ? '#6B00FF' : '#E8E3EF'}`,
          backgroundColor: isDragging ? '#FBF9FF' : '#FFFFFF',
          borderRadius: '16px',
          padding: '32px 24px',
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          boxShadow: isDragging ? '0 4px 20px rgba(107, 0, 255, 0.15)' : 'none'
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = '';
          }}
          style={{ display: 'none' }}
        />

        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#F3EEFF',
            color: '#6B00FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <UploadCloud size={24} />
        </div>

        <div>
          <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#191522', fontFamily: 'var(--font-heading, Sora)' }}>
            {isDragging ? 'Drop to add files' : label}
          </div>
          <p id="file-upload-desc" style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#777184' }}>
            {description}
          </p>
        </div>
      </div>

      {/* File List Rows with Progress Bars */}
      {items.length > 0 && (
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E8E3EF',
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <File size={18} color="#6B00FF" style={{ flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#191522', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: item.error ? '#DC4545' : '#777184' }}>
                      {item.error ? item.error : formatBytes(item.size)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {item.status === 'complete' && (
                    <span style={{ color: '#16A36A', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: 600 }}>
                      <CheckCircle2 size={16} />
                      <span>Ready</span>
                    </span>
                  )}

                  {item.status === 'error' && (
                    <button
                      type="button"
                      onClick={() => retryItem(item)}
                      title={`Retry ${item.name}`}
                      style={{ background: 'none', border: 'none', color: '#6B00FF', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <RefreshCw size={15} />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    title={`Remove ${item.name}`}
                    style={{ background: 'none', border: 'none', color: '#777184', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Progress Bar while uploading */}
              {item.status === 'uploading' && (
                <div>
                  <div style={{ height: '4px', backgroundColor: '#F2ECFF', borderRadius: '2px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${item.progress}%`,
                        backgroundColor: '#6B00FF',
                        transition: 'width 0.2s ease'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.7rem', color: '#6B00FF', marginTop: '2px', fontWeight: 600 }}>
                    {item.progress}%
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FileUpload;
