import { useState, useRef, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
    Download,
    Upload,
    FileSpreadsheet,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Loader2,
    ArrowLeft,
    ArrowRight,
    FileWarning,
    Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    parseImportFile,
    validateImportData,
    ImportType,
    ParsedRow,
    ValidationResult,
    IMPORT_CONFIGS,
} from '@/lib/importUtils';

type ImportStep = 'download' | 'upload' | 'preview' | 'importing' | 'complete';

interface ImportModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    importType: ImportType;
    onImport: (data: ParsedRow[]) => Promise<{ success: number; failed: number; errors: string[] }>;
}

export function ImportModal({
                                open,
                                onClose,
                                onSuccess,
                                importType,
                                onImport,
                            }: ImportModalProps) {
    const [step, setStep] = useState<ImportStep>('download');
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [importProgress, setImportProgress] = useState(0);
    const [importResult, setImportResult] = useState<{
        success: number;
        failed: number;
        errors: string[];
    } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const config = IMPORT_CONFIGS[importType];

    const resetState = () => {
        setStep('download');
        setFile(null);
        setParsedData([]);
        setValidationResult(null);
        setIsProcessing(false);
        setImportProgress(0);
        setImportResult(null);
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleDownloadTemplate = () => {
        // Create CSV content
        const headers = config.headers.join(',');
        const sampleRow = config.sampleData.join(',');
        const csvContent = `${headers}\n${sampleRow}`;

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', config.templateFileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
            title: 'Template Downloaded',
            description: `${config.templateFileName} has been downloaded.`,
        });
    };

    const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (!selectedFile) return;

        // Validate file type
        const validTypes = [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];

        const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
        const isValidType = validTypes.includes(selectedFile.type) ||
            ['csv', 'xlsx', 'xls'].includes(fileExtension || '');

        if (!isValidType) {
            toast({
                variant: 'destructive',
                title: 'Invalid File Type',
                description: 'Please upload a CSV or Excel file.',
            });
            return;
        }

        // Check file size (max 5MB)
        if (selectedFile.size > 5 * 1024 * 1024) {
            toast({
                variant: 'destructive',
                title: 'File Too Large',
                description: 'Please upload a file smaller than 5MB.',
            });
            return;
        }

        setFile(selectedFile);
        setIsProcessing(true);

        try {
            // Parse the file
            const data = await parseImportFile(selectedFile, importType);
            console.log(data);
            setParsedData(data);

            // Validate the data
            const validation = validateImportData(data, importType);
            setValidationResult(validation);

            setStep('preview');
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to Parse File',
                description: error.message || 'Please check the file format and try again.',
            });
            setFile(null);
        } finally {
            setIsProcessing(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    }, [importType, toast]);

    const handleImport = async () => {
        if (!validationResult || validationResult.validRows.length === 0) return;

        setStep('importing');
        setImportProgress(0);

        try {
            // Simulate progress for better UX
            const progressInterval = setInterval(() => {
                setImportProgress(prev => Math.min(prev + 10, 90));
            }, 200);

            const result = await onImport(validationResult.validRows);

            clearInterval(progressInterval);
            setImportProgress(100);
            setImportResult(result);
            setStep('complete');

            if (result.success > 0) {
                toast({
                    title: 'Import Completed',
                    description: `Successfully imported ${result.success} ${config.entityName}${result.success !== 1 ? 's' : ''}.`,
                });
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Import Failed',
                description: error.message || 'An error occurred during import.',
            });
            setStep('preview');
        }
    };

    const handleComplete = () => {
        if (importResult && importResult.success > 0) {
            onSuccess();
        }
        handleClose();
    };

    const renderStepIndicator = () => (
        <div className="flex items-center justify-center gap-2 mb-6">
            {['download', 'upload', 'preview', 'complete'].map((s, index) => {
                const stepIndex = ['download', 'upload', 'preview', 'complete'].indexOf(step === 'importing' ? 'preview' : step);
                const isActive = index <= stepIndex;
                const isCurrent = s === step || (step === 'importing' && s === 'preview');

                return (
                    <div key={s} className="flex items-center">
                        <div
                            className={cn(
                                'h-2 w-2 rounded-full transition-colors',
                                isActive ? 'bg-primary' : 'bg-muted',
                                isCurrent && 'ring-2 ring-primary ring-offset-2'
                            )}
                        />
                        {index < 3 && (
                            <div
                                className={cn(
                                    'h-0.5 w-8 transition-colors',
                                    index < stepIndex ? 'bg-primary' : 'bg-muted'
                                )}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );

    const renderDownloadStep = () => (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileSpreadsheet className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Download Template</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Download the template file and fill in your {config.entityName} data following the format provided.
                </p>
            </div>

            <Alert variant="default" className="border-amber-500/50 bg-amber-500/10">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-700">Important</AlertTitle>
                <AlertDescription className="text-amber-600">
                    <strong>Do not modify the header row!</strong> The first row must remain exactly as provided
                    for the import to work correctly.
                </AlertDescription>
            </Alert>

            <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Template Headers:</h4>
                <div className="flex flex-wrap gap-1">
                    {config.headers.map((header, index) => (
                        <Badge key={header} variant={config.requiredFields.includes(header) ? 'default' : 'outline'}>
                            {header}
                            {config.requiredFields.includes(header) && ' *'}
                        </Badge>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    * Required fields
                </p>
            </div>

            <div className="flex justify-center gap-4">
                <Button onClick={handleDownloadTemplate} className="gap-2">
                    <Download className="h-4 w-4" />
                    Download Template
                </Button>
            </div>
        </div>
    );

    const renderUploadStep = () => (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Upload Your File</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Upload your completed CSV or Excel file with {config.entityName} data.
                </p>
            </div>

            <div
                className={cn(
                    'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer hover:border-primary/50',
                    isProcessing && 'pointer-events-none opacity-50'
                )}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {isProcessing ? (
                    <div className="space-y-3">
                        <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
                        <p className="text-sm text-muted-foreground">Processing file...</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <FileSpreadsheet className="h-10 w-10 mx-auto text-muted-foreground" />
                        <div>
                            <p className="font-medium">Click to upload or drag and drop</p>
                            <p className="text-sm text-muted-foreground">CSV or Excel files (max 5MB)</p>
                        </div>
                    </div>
                )}
            </div>

            {file && (
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <FileSpreadsheet className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
            ({(file.size / 1024).toFixed(1)} KB)
          </span>
                </div>
            )}
        </div>
    );

    const renderImportingStep = () => (
        <div className="space-y-6 py-8">
            <div className="text-center space-y-2">
                <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary" />
                <h3 className="text-lg font-semibold">Importing Data</h3>
                <p className="text-sm text-muted-foreground">
                    Please wait while we import your {config.entityName}s...
                </p>
            </div>
            <Progress value={importProgress} className="w-full" />
            <p className="text-center text-sm text-muted-foreground">
                {importProgress}% complete
            </p>
        </div>
    );
    const renderPreviewStep = () => {
        // Get all columns from the actual data (not just previewColumns)
        const allColumns = validationResult && validationResult.validRows.length > 0
            ? Object.keys(validationResult.validRows[0].data)
            : config.headers;

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="text-lg font-semibold">Preview Data</h3>
                    <div className="flex items-center gap-2">
                        {validationResult && (
                            <>
                                <Badge variant="default" className="bg-green-500">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    {validationResult.validRows.length} Valid
                                </Badge>
                                {validationResult.invalidRows.length > 0 && (
                                    <Badge variant="destructive">
                                        <XCircle className="h-3 w-3 mr-1" />
                                        {validationResult.invalidRows.length} Invalid
                                    </Badge>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {validationResult && validationResult.invalidRows.length > 0 && (
                    <Alert variant="destructive">
                        <FileWarning className="h-4 w-4" />
                        <AlertTitle>Validation Errors</AlertTitle>
                        <AlertDescription>
                            <div className="max-h-24 overflow-auto mt-2">
                                <ul className="text-sm space-y-1">
                                    {validationResult.invalidRows.slice(0, 10).map((row, index) => (
                                        <li key={index}>
                                            Row {row.rowNumber}: {row.errors.join(', ')}
                                        </li>
                                    ))}
                                    {validationResult.invalidRows.length > 10 && (
                                        <li className="text-muted-foreground">
                                            ... and {validationResult.invalidRows.length - 10} more errors
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                {validationResult && validationResult.validRows.length > 0 && (
                    <div className="border rounded-md">
                        {/* Scrollable container - both directions */}
                        <div
                            className="overflow-auto max-h-[300px]"
                            style={{ maxWidth: '100%' }}
                        >
                            <table className="w-full text-sm border-collapse">
                                <thead className="bg-muted/50 sticky top-0 z-10">
                                <tr className="border-b">
                                    <th className="h-10 px-3 text-left align-middle font-medium text-muted-foreground whitespace-nowrap border-r bg-muted/50">
                                        #
                                    </th>
                                    {allColumns.map(col => (
                                        <th
                                            key={col}
                                            className="h-10 px-3 text-left align-middle font-medium text-muted-foreground whitespace-nowrap capitalize bg-muted/50"
                                        >
                                            {col.replace(/_/g, ' ')}
                                        </th>
                                    ))}
                                </tr>
                                </thead>
                                <tbody>
                                {validationResult.validRows.slice(0, 100).map((row, index) => (
                                    <tr
                                        key={index}
                                        className={cn(
                                            "border-b transition-colors hover:bg-muted/50",
                                            index % 2 === 0 ? "bg-background" : "bg-muted/20"
                                        )}
                                    >
                                        <td className="p-3 align-middle font-mono text-xs text-muted-foreground border-r whitespace-nowrap">
                                            {row.rowNumber}
                                        </td>
                                        {allColumns.map(col => (
                                            <td
                                                key={col}
                                                className="p-3 align-middle whitespace-nowrap"
                                                title={row.data[col] || ''}
                                            >
                                                {row.data[col] || <span className="text-muted-foreground">-</span>}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer with count */}
                        <div className="p-2 text-center text-xs text-muted-foreground border-t bg-muted/30 flex items-center justify-center gap-2">
                        <span>
                            {validationResult.validRows.length <= 100
                                ? `${validationResult.validRows.length} rows`
                                : `Showing 100 of ${validationResult.validRows.length} rows`
                            }
                        </span>
                            <span>•</span>
                            <span>{allColumns.length} columns</span>
                            <span>•</span>
                            <span className="text-muted-foreground/70">
                            Scroll to see all data →
                        </span>
                        </div>
                    </div>
                )}

                {validationResult && validationResult.validRows.length === 0 && (
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>No Valid Data</AlertTitle>
                        <AlertDescription>
                            All rows contain errors. Please fix the issues and upload again.
                        </AlertDescription>
                    </Alert>
                )}
            </div>
        );
    };
    const renderCompleteStep = () => (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <div className={cn(
                    'mx-auto h-16 w-16 rounded-full flex items-center justify-center',
                    importResult && importResult.success > 0 ? 'bg-green-500/10' : 'bg-red-500/10'
                )}>
                    {importResult && importResult.success > 0 ? (
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                    ) : (
                        <XCircle className="h-8 w-8 text-red-600" />
                    )}
                </div>
                <h3 className="text-lg font-semibold">
                    {importResult && importResult.success > 0 ? 'Import Complete!' : 'Import Failed'}
                </h3>
            </div>

            {importResult && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-green-500/10 rounded-lg text-center">
                            <p className="text-2xl font-bold text-green-600">{importResult.success}</p>
                            <p className="text-sm text-green-700">Successfully Imported</p>
                        </div>
                        <div className="p-4 bg-red-500/10 rounded-lg text-center">
                            <p className="text-2xl font-bold text-red-600">{importResult.failed}</p>
                            <p className="text-sm text-red-700">Failed to Import</p>
                        </div>
                    </div>

                    {importResult.errors.length > 0 && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Import Errors</AlertTitle>
                            <AlertDescription>
                                <ScrollArea className="h-24 mt-2">
                                    <ul className="text-sm space-y-1">
                                        {importResult.errors.slice(0, 10).map((error, index) => (
                                            <li key={index}>{error}</li>
                                        ))}
                                        {importResult.errors.length > 10 && (
                                            <li>... and {importResult.errors.length - 10} more errors</li>
                                        )}
                                    </ul>
                                </ScrollArea>
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            )}
        </div>
    );

    const renderContent = () => {
        switch (step) {
            case 'download':
                return renderDownloadStep();
            case 'upload':
                return renderUploadStep();
            case 'preview':
                return renderPreviewStep();
            case 'importing':
                return renderImportingStep();
            case 'complete':
                return renderCompleteStep();
            default:
                return null;
        }
    };

    const renderFooter = () => {
        switch (step) {
            case 'download':
                return (
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button onClick={() => setStep('upload')} className="gap-2">
                            Continue
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </DialogFooter>
                );
            case 'upload':
                return (
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setStep('download')} className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                        <Button variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                    </DialogFooter>
                );
            case 'preview':
                return (
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setStep('upload')} className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                        <Button variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleImport}
                            disabled={!validationResult || validationResult.validRows.length === 0}
                            className="gap-2"
                        >
                            <Upload className="h-4 w-4" />
                            Import {validationResult?.validRows.length || 0} {config.entityName}s
                        </Button>
                    </DialogFooter>
                );
            case 'importing':
                return null;
            case 'complete':
                return (
                    <DialogFooter>
                        <Button onClick={handleComplete}>
                            Done
                        </Button>
                    </DialogFooter>
                );
            default:
                return null;
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5" />
                        Import {config.entityName}s
                    </DialogTitle>
                    <DialogDescription>
                        Bulk import {config.entityName}s from a CSV or Excel file
                    </DialogDescription>
                </DialogHeader>

                {renderStepIndicator()}
                {renderContent()}
                {renderFooter()}
            </DialogContent>
        </Dialog>
    );
}