# Medical Report Generator

## Project Overview
A web application for Brazilian doctors to generate medical reports for insurance authorization requests. Users can create templates, manage CID/TUSS codes, and generate formatted reports.

## Technology Stack
- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Netlify
- **Authentication**: Supabase Auth

## Project Structure
- `index.html` - Main report generator form
- `login.html` - Authentication page  
- `dashboard.html` - User dashboard with templates
- `script.js` - Main application logic
- `auth.js` - Authentication handling
- `dashboard.js` - Dashboard functionality
- `cid_data.js` - CID-10 medical codes (12,422 codes)
- `tuss_data.js` - TUSS procedure codes (5,937 codes)

## Database Schema
- `profiles` - User profiles with doctor info, CRM, RQE
- `templates` - Saved report templates
- `reports` - Generated reports history

## Key Features
- User authentication and profiles
- CID/TUSS code autocomplete
- Dynamic form fields (multiple codes)
- Template system for reusable reports
- Automatic CRM/RQE number formatting
- Professional report generation

## Development Commands
- **Deploy**: Push to GitHub → Netlify auto-deploys
- **Database updates**: Run SQL in Supabase SQL Editor
- **Local testing**: Open HTML files in browser

## Recent Changes
- **Report formatting optimization**: Enhanced Word compatibility with proper line breaks
- **Date format improvement**: Added extensive date format (DD de mês de YYYY) in report header
- **Document structure**: Moved date to document top, optimized spacing between sections
- **Word copy/paste**: Fixed line break issues when copying reports to Microsoft Word
- Added CRM state and RQE fields
- Fixed timezone issues with date formatting
- Implemented template system with CID/TUSS persistence

## Current Status
- ✅ Fully functional and deployed
- ✅ Authentication working
- ✅ Template system working  
- ✅ Report generation working
- ✅ All Brazilian medical codes loaded
- ✅ Optimized formatting for Word compatibility

## Known Issues
- None currently identified

## Future Enhancements
- Export to .docx format
- Advanced template editing
- Report history viewing/search
- Bulk operations