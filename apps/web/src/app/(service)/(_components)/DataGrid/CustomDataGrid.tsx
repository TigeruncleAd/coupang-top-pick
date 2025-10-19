'use client'
import { AgGridReact } from 'ag-grid-react'
import { useEffect, useMemo, useState } from 'react'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-material.css'
import './agGrid.css'
import { GridOptions } from 'ag-grid-community'

interface Props {
  columnDefs: any[]
  rowData: any[] | undefined
  height?: number | string
  rowHeight?: number
  gridRef?: any
  gridKey?: string
}
export default function CustomDataGrid({
  columnDefs,
  rowData,
  height,
  rowHeight = 40,
  gridRef,
  gridKey,
  ...gridProps
}: Props & Partial<GridOptions>) {
  const [columnDefsState, setColumnDefsState] = useState<any[]>()

  //stop propation of keydown event
  useEffect(() => {
    const onKeyDown = event => {
      event.stopPropagation()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  const defaultColDef = useMemo(() => {
    return {
      wrapHeaderText: true,
      autoHeaderHeight: true,
      sortable: false,
      resizable: true,
      minWidth: 80,
      suppressMovable: true,
    }
  }, [])

  //그리드 별 컬럼 사이즈 저장
  useEffect(() => {
    if (!columnDefs) return
    const columnDefsFromLocalStorage = localStorage.getItem(gridKey)
    if (gridKey && columnDefsFromLocalStorage) {
      const savedWidth = JSON.parse(columnDefsFromLocalStorage)
      const newCols = columnDefs.map(column => {
        return {
          ...column,
          width: savedWidth.find(saved => saved.colId === column.field)?.width ?? column.width,
          pinned: savedWidth.find(saved => saved.colId === column.field)?.pinned ?? column.pinned,
        }
      })
      setColumnDefsState([...newCols])
    } else {
      setColumnDefsState([...columnDefs])
    }
  }, [columnDefs, gridKey])
  return (
    <div className="ag-theme-material" style={{ height: height ?? '75vh', width: '100%', maxHeight: '100vh' }}>
      <AgGridReact
        ref={gridRef}
        columnDefs={columnDefsState}
        defaultColDef={defaultColDef}
        rowData={rowData}
        rowSelection={'multiple'}
        suppressRowClickSelection={true}
        onCellValueChanged={params => {
          params.api.redrawRows()
          params.data.isEdited = true
        }}
        onColumnResized={params => {
          localStorage.setItem(gridKey, JSON.stringify(params.api.getColumnState().map(column => column)))
        }}
        onColumnPinned={params => {
          localStorage.setItem(gridKey, JSON.stringify(params.api.getColumnState().map(column => column)))
        }}
        undoRedoCellEditing={true}
        rowHeight={rowHeight}
        overlayNoRowsTemplate={'조회된 데이터가 없습니다.'}
        onCellEditingStopped={params => {
          params.data.isEdited = true
          params.api.redrawRows()
          return true
        }}
        {...gridProps}
      />
    </div>
  )
}
