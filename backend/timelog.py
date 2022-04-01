import time
import math

class TimeLog:
    def __init__(self):
        self.startTime = time.time()
        self.stopTime = 0

        self.partialStartTime = time.time()
        self.partialStopTime = 0
    
    def getElapsedTime(self, partial=False):
        if not partial:
            self.stopTime = time.time()
            return self.stopTime - self.startTime
        else:
            self.partialStopTime = time.time()
            return self.partialStopTime - self.partialStartTime

    
    def getElapsedTimeString(self, partial=False):
        t = int(self.getElapsedTime(partial))
        h = math.floor(t / 3600)
        m = math.floor((t - h*3600)/60)
        s = (t - h*3600 - m*60)

        if h == 0:
            return f"[{m}m {s}s]"
        else:
            return f"[{h}h {m}m {s}s]"
    
    def setPartial(self):
        self.partialStartTime = time.time()
    
    def print(self, message, elapsedTime=True, reset=True):
        s = f"\x1b[90m{TimeLog.currentTime()}\033[0m {message}"
        if elapsedTime:
            if len(s) < 60:
                for _ in range(60 - len(s)): s += " "
            s += f"\x1b[35m{self.getElapsedTimeString(True)}\033[0m"
        print(s)
        if reset:
            self.setPartial()

    @staticmethod
    def currentTime():
        return "[" + time.strftime("%H:%M:%S") + "]"
    