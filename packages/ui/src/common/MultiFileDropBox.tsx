"use client";
import { uploadS3PreSigned } from "@repo/utils";
import { useState } from "react";
interface FileDropBoxProps {
  handleChange: (value: any) => any;
  value?: any[];
  objectKey: string;
  maxFileSize?: number;
  acceptableFileTypes?: string[];
  uploadKey?: string[];
  dropBoxClassName?: string;
  isSingle?: boolean;
  dropboxText?: string;
}
const defaultAcceptableFileTypes = [
  "pdf",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "xls",
  "xlsx",
  "hwp",
  "txt",
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "zip",
  "txt",
  "csv",
];
const defaultDropboxClassName =
  "w-full rounded text-center py-16 text-sm bg-zinc-100 text-[#333333] whitespace-pre-wrap";

export default function MultiFileDropBox({
  handleChange,
  value = [],
  objectKey,
  maxFileSize = 20,
  uploadKey,
  acceptableFileTypes = defaultAcceptableFileTypes,
  dropBoxClassName = defaultDropboxClassName,
  isSingle = false,
  dropboxText,
}: FileDropBoxProps) {
  const [uploading, setUploading] = useState(false);
  async function handleFileInput(e) {
    setUploading(true);
    try {
      let newValue: any[] = value ? [...value] : [];
      const files = e.target.files ?? e.dataTransfer.files;
      if (isSingle) {
        if (e.target.files?.length > 1)
          return alert("한개의 파일만 업로드 가능합니다");
        if (e.dataTransfer?.files?.length > 1)
          return alert("한개의 파일만 업로드 가능합니다");
      }

      for (let i = 0; i < files.length; i++) {
        //check file size under 20mb
        if (files[i].size > maxFileSize * 1024 * 1024) {
          alert(`${maxFileSize}MB 이하의 파일만 업로드 가능합니다`);
          e.target.value = "";
          return;
        }
        // check file type
        const fileExtension = files[i].name.split(".").pop().toLowerCase();
        if (
          acceptableFileTypes.length > 0 &&
          !acceptableFileTypes.includes(fileExtension)
        ) {
          alert("지원하지 않는 파일 형식입니다");
          e.target.value = "";
          return;
        }
      }

      for (let i = 0; i < files.length; i++) {
        const { public_url: uri, s3Key } = await uploadS3PreSigned(
          files[i],
          uploadKey ?? [objectKey],
        );
        const newFile = {
          name: files[i].name,
          uri,
          s3Key,
        };
        if (isSingle) newValue = [newFile];
        else newValue.push(newFile);
      }
      e.target.value = "";
      setUploading(false);
      handleChange(newValue);
    } catch (e) {
      alert("파일 업로드에 실패했습니다");
    } finally {
      setUploading(false);
    }
  }
  const defaultDropboxText = `클릭하거나\n파일을 드랍하여 업로드\n(최대 ${maxFileSize}MB)`;
  return (
    <label htmlFor={objectKey} draggable={false}>
      <input
        id={objectKey}
        type="file"
        className="hidden"
        onChange={handleFileInput}
        disabled={uploading}
        multiple={!isSingle}
        accept={acceptableFileTypes.map((type) => `.${type}`).join(",")}
      />
      {uploading ? (
        <div className="w-full flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-gray-200 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div
          className={dropBoxClassName}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleFileInput(e);
          }}
        >
          {dropboxText ?? defaultDropboxText}
        </div>
      )}
    </label>
  );
}
