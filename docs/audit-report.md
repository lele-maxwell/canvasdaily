# 🧠 "Thinking in React" Audit Report for Canvas Daily

This report evaluates how well the codebase follows the five-step “Thinking in React” approach.

---

## Step 1: Break the UI into a Component Hierarchy
- **Monolithic Admin Dashboard**  
  - **Location**: `src/app/admin/page.tsx:1-914`  
  - **Issue**: Single 900+-line component handles stats cards, scheduler controls, prompt table, creation and configuration modals, and form logic.  
  - **Explanation**: Violates component hierarchy by mixing distinct UI sections. Should be split into focused subcomponents: `AdminStats`, `SchedulerControl`, `PromptTable`, `CreatePromptModal`, etc.

- **Overly Complex Today's Prompt Page**  
  - **Location**: `src/app/prompts/today/page.tsx:1-812`  
  - **Issue**: One component implements hero badge, typewriter animation, countdown timer, prompt card, submission grid, and submission form.  
  - **Explanation**: Lacks clear component boundaries. Should decompose into `PromptHeader`, `CountdownTimer`, `PromptCard`, `SubmissionGrid`, and `SubmissionForm`.

- **Repeated Navigation Logic**  
  - **Location**:  
    - `src/app/auth/signin/page.tsx:88-129`  
    - `src/app/auth/signup/page.tsx:134-175`  
  - **Issue**: Auth pages duplicate header/navbar JSX instead of using shared `Navigation` component.  
  - **Explanation**: Breaks DRY and misses reuse of a top-level navigation component.

---

## Step 2: Build a Static Version in React
- **Mock Data Mixed with Real Fetch Logic**  
  - **Location**: `src/app/prompts/today/page.tsx:55-110`  
  - **Issue**: Hard-coded `MOCK_PROMPT` and `MOCK_SUBMISSIONS` live alongside live API calls in the same component.  
  - **Explanation**: Static and dynamic code should be separated. A static UI prototype should exist independently (Storybook or static component) before adding data fetching logic.

---

## Step 3: Find the Minimal (but Complete) Representation of UI State
- **Derived State Stored Instead of Computed**  
  - **Location**:  
    - `src/app/prompts/today/page.tsx:118-129` (typewriter `displayedText`)  
    - `src/app/prompts/today/page.tsx:196-204` (`timeLeft` state)  
  - **Issue**: Both the typewriter display text and countdown time are stored in component state rather than computed on each render from the prompt description or interval end timestamp.  
  - **Explanation**: Introduces unnecessary complexity. Derived values can be calculated during render or custom hooks, reducing state management overhead.

---

## Step 4: Identify Where State Should Live
- **State Deep in Leaf Components**  
  - **Location**:  
    - `src/app/prompts/today/page.tsx:113` (`showSubmissions` toggled within the page)  
    - `src/app/admin/page.tsx:137` (`loading`, `stats`, `prompts`, `schedulerStatus`, and form state all in one component)  
  - **Issue**: UI state that impacts multiple subcomponents resides at the leaf page component instead of being lifted to a parent or context.  
  - **Explanation**: State that drives visibility or data across child components should live in a shared parent or context provider to simplify data flow and avoid prop drilling.

---

## Step 5: Add Inverse Data Flow
- **Child Components Directly Fetch Data**  
  - **Location**:  
    - `src/app/prompts/today/page.tsx:124-167` (`useEffect` fetching prompts and submissions)  
    - `src/app/admin/page.tsx:165-191` (`fetchAdminData` called inside page component)  
  - **Issue**: Data fetching lives within the page component rather than being orchestrated by higher-order components or custom hooks that pass data downward as props.  
  - **Explanation**: Breaks unidirectional data flow. Better to fetch data in parent or a data-loading wrapper and supply it to presentational child components via props or context, with callbacks handling user interactions.

---

*End of Audit Report.*