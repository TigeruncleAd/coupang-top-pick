import { useContext } from "react";
import MultiFileDropBox from "../common/MultiFileDropBox";
import { FormRenderContext } from "./formRender";
import _ from "lodash";
export function File({
  label,
  itemKey,
  dropboxClassName,
  acceptableFileTypes,
  maxFileSize = 20,
  className,
  uploadKey,
  readOnly = false,
  downloadable = true,
  isSingle = false,
  dropboxText,
}: {
  label: string;
  itemKey: string;
  dropboxClassName?: string;
  acceptableFileTypes?: string[];
  maxFileSize?: number;
  className?: string;
  uploadKey?: string[];
  readOnly?: boolean;
  downloadable?: boolean;
  isSingle?: boolean;
  dropboxText?: string;
}) {
  const { form, setForm, formErrors } = useContext(FormRenderContext);
  const value = _.get(form, itemKey);
  const error = _.get(formErrors, itemKey);
  const s3Url = process.env.NEXT_PUBLIC_S3_URL;
  return (
    <div className={className ?? ""} key={itemKey}>
      <label className="block text-sm font-medium leading-6 mb-2">
        {label}
      </label>
      <div>
        {readOnly && !value && (
          <div className="text-sm text-gray-500">첨부된 파일이 없습니다.</div>
        )}
        {value?.map((file, index) => {
          const href = file.s3Key ? `${s3Url}/${file.s3Key}` : file.uri;
          return (
            <div key={index} className="flex items-center">
              {downloadable ? (
                <a
                  className="text-sm font-medium leading-6 text-blue-500 py-0.5"
                  href={href}
                  target={"_blank"}
                >
                  {file.name}
                </a>
              ) : (
                <div className="text-sm font-medium leading-6 text-gray-500 py-0.5">
                  {file.name}
                </div>
              )}
              {!readOnly && (
                <button
                  type="button"
                  className="ml-4 text-sm font-medium leading-6 text-red-500"
                  onClick={() => {
                    const newForm = _.cloneDeep(form);
                    _.set(
                      newForm,
                      itemKey,
                      value?.filter((_, i) => i !== index),
                    );
                    setForm(newForm);
                  }}
                >
                  삭제
                </button>
              )}
            </div>
          );
        })}
      </div>
      {!readOnly && (
        <div>
          <MultiFileDropBox
            dropBoxClassName={dropboxClassName}
            objectKey={itemKey}
            acceptableFileTypes={acceptableFileTypes}
            value={value}
            maxFileSize={maxFileSize}
            uploadKey={uploadKey ?? ["post", "attachments", "files"]}
            isSingle={isSingle}
            dropboxText={dropboxText}
            handleChange={(newValue) => {
              const newForm = _.cloneDeep(form);
              _.set(newForm, itemKey, newValue);
              setForm(newForm);
            }}
          />
        </div>
      )}
      {error && <div className="mt-1 text-xs text-red-500">{error}</div>}
    </div>
  );
}
