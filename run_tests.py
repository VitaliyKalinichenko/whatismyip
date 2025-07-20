#!/usr/bin/env python3
"""
Comprehensive test runner for the WhatIsMyIP application.
This script runs all tests for both frontend and backend components.
"""

import os
import sys
import subprocess
import json
import time
from pathlib import Path
from typing import Dict, List, Tuple, Optional

class TestRunner:
    """Handles running tests for both frontend and backend."""
    
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.frontend_dir = self.project_root / "frontend"
        self.backend_dir = self.project_root / "backend"
        self.results = {
            "frontend": {"passed": 0, "failed": 0, "errors": []},
            "backend": {"passed": 0, "failed": 0, "errors": []},
            "start_time": time.time(),
            "end_time": None
        }
    
    def print_banner(self, title: str):
        """Print a formatted banner."""
        print("\n" + "="*60)
        print(f"🧪 {title}")
        print("="*60)
    
    def print_section(self, title: str):
        """Print a formatted section header."""
        print(f"\n{'='*40}")
        print(f"📋 {title}")
        print(f"{'='*40}")
    
    def run_command(self, cmd: List[str], cwd: Path, timeout: int = 300) -> Tuple[int, str, str]:
        """Run a command and return exit code, stdout, stderr."""
        try:
            result = subprocess.run(
                cmd,
                cwd=cwd,
                capture_output=True,
                text=True,
                timeout=timeout
            )
            return result.returncode, result.stdout, result.stderr
        except subprocess.TimeoutExpired:
            return 1, "", f"Command timed out after {timeout} seconds"
        except Exception as e:
            return 1, "", str(e)
    
    def check_dependencies(self) -> bool:
        """Check if all required dependencies are installed."""
        self.print_section("Checking Dependencies")
        
        # Check Node.js and npm
        node_code, node_out, node_err = self.run_command(["node", "--version"], self.frontend_dir)
        npm_code, npm_out, npm_err = self.run_command(["npm", "--version"], self.frontend_dir)
        
        if node_code != 0 or npm_code != 0:
            print("❌ Node.js or npm not found. Please install Node.js.")
            return False
        
        print(f"✅ Node.js {node_out.strip()}")
        print(f"✅ npm {npm_out.strip()}")
        
        # Check Python
        python_code, python_out, python_err = self.run_command(["python", "--version"], self.backend_dir)
        if python_code != 0:
            python_code, python_out, python_err = self.run_command(["python3", "--version"], self.backend_dir)
        
        if python_code != 0:
            print("❌ Python not found. Please install Python 3.11+.")
            return False
        
        print(f"✅ Python {python_out.strip()}")
        return True
    
    def install_frontend_dependencies(self) -> bool:
        """Install frontend dependencies."""
        self.print_section("Installing Frontend Dependencies")
        
        print("📦 Installing npm packages...")
        code, out, err = self.run_command(["npm", "install"], self.frontend_dir)
        
        if code != 0:
            print(f"❌ Failed to install frontend dependencies:")
            print(f"STDOUT: {out}")
            print(f"STDERR: {err}")
            return False
        
        print("✅ Frontend dependencies installed successfully")
        return True
    
    def install_backend_dependencies(self) -> bool:
        """Install backend dependencies."""
        self.print_section("Installing Backend Dependencies")
        
        print("📦 Installing Python packages...")
        
        # Install main dependencies
        code, out, err = self.run_command(
            ["pip", "install", "-r", "requirements.txt"],
            self.backend_dir
        )
        
        if code != 0:
            print(f"❌ Failed to install backend dependencies:")
            print(f"STDOUT: {out}")
            print(f"STDERR: {err}")
            return False
        
        # Install test dependencies
        test_requirements = self.backend_dir / "requirements-test.txt"
        if test_requirements.exists():
            code, out, err = self.run_command(
                ["pip", "install", "-r", "requirements-test.txt"],
                self.backend_dir
            )
            
            if code != 0:
                print(f"❌ Failed to install test dependencies:")
                print(f"STDOUT: {out}")
                print(f"STDERR: {err}")
                return False
        
        print("✅ Backend dependencies installed successfully")
        return True
    
    def run_frontend_tests(self) -> bool:
        """Run frontend tests."""
        self.print_section("Running Frontend Tests")
        
        # Check if test files exist
        test_files = list(self.frontend_dir.glob("src/**/*.test.{ts,tsx,js,jsx}"))
        if not test_files:
            print("⚠️  No frontend test files found. Skipping frontend tests.")
            return True
        
        print(f"🧪 Found {len(test_files)} test files")
        
        # Run tests
        code, out, err = self.run_command(
            ["npm", "run", "test:ci"],
            self.frontend_dir,
            timeout=600
        )
        
        if code != 0:
            print("❌ Frontend tests failed:")
            print(f"STDOUT: {out}")
            print(f"STDERR: {err}")
            self.results["frontend"]["failed"] += 1
            self.results["frontend"]["errors"].append({"stdout": out, "stderr": err})
            return False
        
        print("✅ Frontend tests passed")
        self.results["frontend"]["passed"] += 1
        
        # Parse test results if available
        try:
            # Look for Jest output
            if "Tests:" in out:
                lines = out.split("\n")
                for line in lines:
                    if "passed" in line.lower() and "failed" in line.lower():
                        print(f"📊 {line.strip()}")
        except:
            pass
        
        return True
    
    def run_backend_tests(self) -> bool:
        """Run backend tests."""
        self.print_section("Running Backend Tests")
        
        # Check if test files exist
        test_files = list(self.backend_dir.glob("tests/**/*.py"))
        if not test_files:
            print("⚠️  No backend test files found. Skipping backend tests.")
            return True
        
        print(f"🧪 Found {len(test_files)} test files")
        
        # Create reports directory
        reports_dir = self.backend_dir / "reports"
        reports_dir.mkdir(exist_ok=True)
        
        # Run tests
        code, out, err = self.run_command(
            ["python", "-m", "pytest", "-v", "--tb=short"],
            self.backend_dir,
            timeout=600
        )
        
        if code != 0:
            print("❌ Backend tests failed:")
            print(f"STDOUT: {out}")
            print(f"STDERR: {err}")
            self.results["backend"]["failed"] += 1
            self.results["backend"]["errors"].append({"stdout": out, "stderr": err})
            return False
        
        print("✅ Backend tests passed")
        self.results["backend"]["passed"] += 1
        
        # Parse test results
        try:
            lines = out.split("\n")
            for line in lines:
                if "passed" in line.lower() or "failed" in line.lower() or "error" in line.lower():
                    if any(word in line for word in ["passed", "failed", "error", "PASSED", "FAILED", "ERROR"]):
                        print(f"📊 {line.strip()}")
        except:
            pass
        
        return True
    
    def run_integration_tests(self) -> bool:
        """Run integration tests."""
        self.print_section("Running Integration Tests")
        
        print("🔄 Starting backend server for integration tests...")
        
        # Start backend server in background
        backend_process = None
        try:
            backend_process = subprocess.Popen(
                ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"],
                cwd=self.backend_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            # Wait for server to start
            time.sleep(5)
            
            # Check if server is running
            code, out, err = self.run_command(
                ["curl", "-f", "http://localhost:8000/health"],
                self.project_root
            )
            
            if code != 0:
                print("❌ Backend server failed to start")
                return False
            
            print("✅ Backend server started successfully")
            
            # Run integration tests
            code, out, err = self.run_command(
                ["python", "-m", "pytest", "-v", "-m", "integration"],
                self.backend_dir,
                timeout=300
            )
            
            if code != 0:
                print("❌ Integration tests failed:")
                print(f"STDOUT: {out}")
                print(f"STDERR: {err}")
                return False
            
            print("✅ Integration tests passed")
            return True
            
        except Exception as e:
            print(f"❌ Integration test error: {e}")
            return False
        finally:
            if backend_process:
                backend_process.terminate()
                backend_process.wait()
    
    def run_linting(self) -> bool:
        """Run linting for both frontend and backend."""
        self.print_section("Running Linting")
        
        # Frontend linting
        print("🔍 Running frontend linting...")
        code, out, err = self.run_command(["npm", "run", "lint"], self.frontend_dir)
        
        if code != 0:
            print("⚠️  Frontend linting issues found:")
            print(f"STDOUT: {out}")
            print(f"STDERR: {err}")
        else:
            print("✅ Frontend linting passed")
        
        # Backend linting (if flake8 is available)
        print("🔍 Running backend linting...")
        code, out, err = self.run_command(["python", "-m", "flake8", "app", "--max-line-length=100"], self.backend_dir)
        
        if code != 0:
            print("⚠️  Backend linting issues found:")
            print(f"STDOUT: {out}")
            print(f"STDERR: {err}")
        else:
            print("✅ Backend linting passed")
        
        return True
    
    def generate_report(self):
        """Generate a comprehensive test report."""
        self.results["end_time"] = time.time()
        duration = self.results["end_time"] - self.results["start_time"]
        
        self.print_section("Test Summary Report")
        
        total_passed = self.results["frontend"]["passed"] + self.results["backend"]["passed"]
        total_failed = self.results["frontend"]["failed"] + self.results["backend"]["failed"]
        total_tests = total_passed + total_failed
        
        print(f"📊 Test Results:")
        print(f"   Total Tests: {total_tests}")
        print(f"   ✅ Passed: {total_passed}")
        print(f"   ❌ Failed: {total_failed}")
        print(f"   ⏱️  Duration: {duration:.2f} seconds")
        
        if self.results["frontend"]["passed"] > 0:
            print(f"   🌐 Frontend: ✅ PASSED")
        if self.results["frontend"]["failed"] > 0:
            print(f"   🌐 Frontend: ❌ FAILED")
        
        if self.results["backend"]["passed"] > 0:
            print(f"   🔧 Backend: ✅ PASSED")
        if self.results["backend"]["failed"] > 0:
            print(f"   🔧 Backend: ❌ FAILED")
        
        # Save report to file
        report_file = self.project_root / "test_report.json"
        with open(report_file, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        print(f"\n📄 Detailed report saved to: {report_file}")
        
        return total_failed == 0
    
    def run_all_tests(self) -> bool:
        """Run all tests."""
        self.print_banner("WhatIsMyIP Comprehensive Test Suite")
        
        print("🚀 Starting comprehensive test run...")
        print(f"📁 Project root: {self.project_root}")
        print(f"📁 Frontend dir: {self.frontend_dir}")
        print(f"📁 Backend dir: {self.backend_dir}")
        
        # Check dependencies
        if not self.check_dependencies():
            return False
        
        # Install dependencies
        if not self.install_frontend_dependencies():
            return False
        
        if not self.install_backend_dependencies():
            return False
        
        # Run tests
        frontend_success = self.run_frontend_tests()
        backend_success = self.run_backend_tests()
        
        # Run linting
        self.run_linting()
        
        # Generate report
        overall_success = self.generate_report()
        
        if overall_success:
            print("\n🎉 All tests passed! Your code is ready for production.")
        else:
            print("\n⚠️  Some tests failed. Please review the errors above.")
        
        return overall_success

def main():
    """Main entry point."""
    runner = TestRunner()
    
    # Parse command line arguments
    if len(sys.argv) > 1:
        if sys.argv[1] == "--frontend":
            runner.run_frontend_tests()
        elif sys.argv[1] == "--backend":
            runner.run_backend_tests()
        elif sys.argv[1] == "--integration":
            runner.run_integration_tests()
        elif sys.argv[1] == "--lint":
            runner.run_linting()
        else:
            print("Usage: python run_tests.py [--frontend|--backend|--integration|--lint]")
            return 1
    else:
        # Run all tests
        success = runner.run_all_tests()
        return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main()) 