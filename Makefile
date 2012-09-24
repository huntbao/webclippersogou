install:
	@echo "Kill SogouExplorer"
	@taskkill /f /im SogouExplorer.exe /fi "STATUS eq RUNNING"
	@echo "Restart SogouExplorer"
	@sleep 6
	@SogouExplorer.exe
	@echo "Restart SogouExplorer success"
