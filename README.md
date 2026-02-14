# Waterloo Undergraduate Course Map

A course prerequisite visualization tool built with Next.js that displays computer science courses and their relationships in an interactive graph.

- Scrapes course data from the Undergraduate Calendar
- Creates a visual graph representation of course prerequisites
- Uses **Next.js**, **React** and **D3.js**
- Stores user selections in **MongoDB**

![image](https://github.com/z4ab/course-map/assets/55454625/bd11c59e-ea9b-4862-940b-c43cc180cfcd)

## Running locally

### Prerequisites
- Install [Node.js](https://nodejs.org/en) (v18 or higher)
- MongoDB account or local MongoDB instance

### Installation

1. Clone the repository 
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file in the root directory with your MongoDB credentials:
   ```
   MONGODB_PASSWORD=your_mongodb_password_here
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

This is a Next.js application with:
- **API Routes** (`app/api/`) - Backend endpoints for course data and selections
- **Components** (`app/components/`) - React components for UI
- **Library** (`lib/`) - Scraper and course relationship data
- **Public** (`public/`) - Static files

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server

## Future improvements

- Using topological sort algorithm to determine the order courses have to be taken
  - Use more graph theory concepts to enhance experience
- Improve design (HTML+CSS)
- Add more courses
  - Color coding for different subjects
