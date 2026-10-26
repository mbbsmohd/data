// Global Loading Manager & Event Bus
type LoadingListener = (isLoading: boolean, progress: number) => void;

class LoadingManager {
  private activeRequests = 0;
  private listeners: LoadingListener[] = [];
  private currentProgress = 0;
  private timer: any = null;
  private minDisplayTimer: any = null;
  private startTime = 0;

  public subscribe(listener: LoadingListener): () => void {
    this.listeners.push(listener);
    listener(this.activeRequests > 0, this.currentProgress);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    const isLoading = this.activeRequests > 0;
    this.listeners.forEach(l => l(isLoading, this.currentProgress));
  }

  public start() {
    this.activeRequests++;
    if (this.activeRequests === 1) {
      this.startTime = Date.now();
      this.currentProgress = 15;
      this.notify();

      if (this.timer) clearInterval(this.timer);
      this.timer = setInterval(() => {
        if (this.currentProgress < 85) {
          this.currentProgress += Math.random() * 15;
          if (this.currentProgress > 85) this.currentProgress = 85;
          this.notify();
        }
      }, 200);
    }
  }

  public stop() {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
    if (this.activeRequests === 0) {
      if (this.timer) clearInterval(this.timer);
      this.currentProgress = 100;
      this.notify();

      const elapsed = Date.now() - this.startTime;
      const minDisplay = 200; // Minimum 200ms display to prevent jarring flicker
      const remaining = Math.max(0, minDisplay - elapsed);

      if (this.minDisplayTimer) clearTimeout(this.minDisplayTimer);
      this.minDisplayTimer = setTimeout(() => {
        this.currentProgress = 0;
        this.notify();
      }, remaining + 250);
    }
  }

  public setProgress(pct: number) {
    this.currentProgress = Math.min(100, Math.max(0, pct));
    this.notify();
  }
}

export const globalLoading = new LoadingManager();
