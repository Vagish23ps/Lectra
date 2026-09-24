declare module "pdfjs-dist/build/pdf.mjs" {
  export const GlobalWorkerOptions: {
    workerSrc: string;
  };
  export const version: string;
  export function getDocument(src: unknown): {
    promise: Promise<{
      numPages: number;
      getPage: (pageNumber: number) => Promise<{
        getViewport: (params: { scale: number }) => {
          width: number;
          height: number;
        };
        render: (params: {
          canvasContext: CanvasRenderingContext2D;
          viewport: object;
        }) => {
          promise: Promise<void>;
          cancel: () => void;
        };
      }>;
    }>;
  };
}
