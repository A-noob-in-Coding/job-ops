"""
Automate RXResume (rxresu.me) to import resume and export PDF using Playwright.
"""

import os
from pathlib import Path
from playwright.sync_api import sync_playwright

# Configuration
RXRESUME_EMAIL = os.getenv("RXRESUME_EMAIL", "")
RXRESUME_PASSWORD = os.getenv("RXRESUME_PASSWORD", "")

BASE_DIR = Path(__file__).parent
RESUME_JSON_PATH = BASE_DIR / "base.json"
OUTPUT_DIR = BASE_DIR / "resumes"


def login(page):
    """Log in to RXResume."""
    page.goto("https://rxresu.me/auth/login")
    page.fill('input[placeholder="john.doe@example.com"]', RXRESUME_EMAIL)
    page.fill('input[type="password"]', RXRESUME_PASSWORD)
    page.click('button:has-text("Sign in")')
    page.wait_for_url("**/dashboard/resumes", timeout=15000)
    page.click('button:has-text("List")')


def import_resume(page, json_path: Path):
    """Import a resume JSON file."""
    page.click('h4:has-text("Import")')
    page.set_input_files('input[type="file"]', str(json_path))
    page.click('button:has-text("Validate")')
    page.click('button:has-text("Import")')


def navigate_to_top_resume(page):
    """Navigate to the first resume in the editor."""
    if "/dashboard/resumes" not in page.url:
        page.goto("https://rxresu.me/dashboard/resumes")
        page.wait_for_load_state("networkidle")

    # wait a beat for the list to update
    page.wait_for_timeout(1000)
    page.click('span[data-state="closed"]:first-of-type div:first-of-type')
    page.wait_for_url("**/builder/**", timeout=10000)


def export_pdf(page, output_path: Path) -> Path:
    """Export the resume as PDF."""
    page.wait_for_timeout(1500)  # Wait for builder to fully load

    selector = "div.inline-flex.items-center.justify-center.rounded-full.bg-background.px-4.shadow-xl button:last-of-type"

    with page.expect_download(timeout=30000) as download_info:
        page.click(selector)

    download = download_info.value
    output_path.parent.mkdir(parents=True, exist_ok=True)
    download.save_as(str(output_path))
    return output_path


def generate_resume_pdf(
    output_filename: str = "resume.pdf",
    import_json: bool = False,
    json_path: Path = None,
) -> Path:
    """
    Import resume and export PDF.

    Args:
        output_filename: Name of the output PDF file
        import_json: Whether to import a JSON file first
        json_path: Path to JSON file (if import_json is True)

    Returns:
        Path to the generated PDF
    """
    output_path = OUTPUT_DIR / output_filename

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        try:
            login(page)

            if import_json:
                import_resume(page, json_path or RESUME_JSON_PATH)

            navigate_to_top_resume(page)
            export_pdf(page, output_path)
        finally:
            browser.close()

    return output_path


if __name__ == "__main__":
    pdf_path = generate_resume_pdf(
        output_filename="test_resume.pdf",
        import_json=True,
    )
    print(f"PDF saved: {pdf_path}")
