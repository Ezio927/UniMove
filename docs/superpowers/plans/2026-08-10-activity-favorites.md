# Activity Favorites Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add authenticated activity favorites to the UniMove API and expose them on activity cards, the activity detail page, and the user profile.

**Architecture:** Store favorite activity references as a set-like ObjectId array on each User document. Put all database rules in `UserService`, expose three authenticated user routes, and isolate client state in a reusable `useFavorites` hook consumed by existing pages and cards.

**Tech Stack:** Node.js 22, Express 4, TypeScript 5.9, Mongoose 8, React 19, Ant Design 5, Vitest 4.

## Global Constraints

- Do not add runtime dependencies.
- Preserve the existing JWT authentication and centralized `AppError` handling.
- Favorite and unfavorite operations must be idempotent.
- Deleted or missing activities must not appear in favorite results.
- Follow red-green-refactor: every implementation change starts with a failing focused test.
- Do not change enrollment, order, or comment behavior.

---

## File Map

- `backend/src/models/User.ts`: declares and persists favorite activity references.
- `backend/src/services/UserService.ts`: validates IDs and performs favorite queries and atomic updates.
- `backend/src/services/UserService.test.ts`: verifies service input boundaries and update semantics.
- `backend/src/controllers/UserController.ts`: maps authenticated HTTP requests to the service.
- `backend/src/routes/users.ts`: publishes the three authenticated routes.
- `frontend/src/api/user.ts`: defines favorite response types and HTTP calls.
- `frontend/src/hooks/useFavorites.ts`: owns favorite loading, mutation, error, and busy state.
- `frontend/src/hooks/useFavorites.test.tsx`: verifies hook behavior independently of pages.
- `frontend/src/components/ActivityCard.tsx`: renders a controlled favorite button.
- `frontend/src/components/ActivityCard.test.tsx`: verifies favorite UI events and state.
- `frontend/src/pages/ActivityList.tsx`: connects catalog cards to the favorites hook.
- `frontend/src/pages/ActivityDetail.tsx`: connects the detail action to the favorites hook.
- `frontend/src/pages/Profile.tsx`: renders the current user's favorite activities.
- `frontend/src/pages/Profile.css`: lays out the favorite activity grid.
- `docs/API.md`: documents favorite endpoints.

### Task 1: Backend favorite domain and API

**Files:**
- Modify: `backend/src/models/User.ts`
- Modify: `backend/src/services/UserService.ts`
- Create: `backend/src/services/UserService.test.ts`
- Modify: `backend/src/controllers/UserController.ts`
- Modify: `backend/src/routes/users.ts`
- Modify: `docs/API.md`

**Interfaces:**
- Produces: `UserService.getFavorites(userId: string)` returning populated activities.
- Produces: `UserService.addFavorite(userId: string, activityId: string)` returning the updated favorite ID array.
- Produces: `UserService.removeFavorite(userId: string, activityId: string)` returning the updated favorite ID array.
- Produces: authenticated `GET`, `PUT`, and `DELETE /api/users/favorites[/:activityId]` endpoints.

- [ ] **Step 1: Write failing service tests**

Create `backend/src/services/UserService.test.ts` with focused tests that do not require a live MongoDB:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Activity } from '../models/Activity';
import { User } from '../models/User';
import { UserService } from './UserService';

describe('UserService favorites', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('rejects an invalid activity ID before database work', async () => {
    const activitySpy = vi.spyOn(Activity, 'exists');
    await expect(UserService.addFavorite('507f1f77bcf86cd799439011', 'invalid'))
      .rejects.toMatchObject({ statusCode: 400 });
    expect(activitySpy).not.toHaveBeenCalled();
  });

  it('uses addToSet so repeated favorites stay idempotent', async () => {
    vi.spyOn(Activity, 'exists').mockResolvedValue({ _id: '507f1f77bcf86cd799439012' } as never);
    const select = vi.fn().mockResolvedValue({ favoriteActivities: ['507f1f77bcf86cd799439012'] });
    const update = vi.spyOn(User, 'findByIdAndUpdate').mockReturnValue({ select } as never);
    await UserService.addFavorite('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012');
    expect(update).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      { $addToSet: { favoriteActivities: '507f1f77bcf86cd799439012' } },
      { new: true }
    );
  });

  it('uses pull so repeated removals stay idempotent', async () => {
    const select = vi.fn().mockResolvedValue({ favoriteActivities: [] });
    const update = vi.spyOn(User, 'findByIdAndUpdate').mockReturnValue({ select } as never);
    await UserService.removeFavorite('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012');
    expect(update).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      { $pull: { favoriteActivities: '507f1f77bcf86cd799439012' } },
      { new: true }
    );
  });
});
```

- [ ] **Step 2: Run the focused test and verify red**

Run: `cd backend && npm test -- src/services/UserService.test.ts`

Expected: FAIL because the three favorite service methods do not exist.

- [ ] **Step 3: Add the model field and minimal service implementation**

Extend `IUser` and `UserSchema` in `backend/src/models/User.ts`:

```ts
favoriteActivities: mongoose.Types.ObjectId[];

favoriteActivities: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Activity',
  default: []
}]
```

Add to `UserService` using `mongoose.isValidObjectId`, `Activity.exists`, `$addToSet`, `$pull`, and `.populate({ path: 'favoriteActivities', match: { _id: { $exists: true } } })`. Invalid IDs return `AppError(400, ...)`, a missing activity on add returns 404, and a missing user returns 404.

```ts
static async addFavorite(userId: string, activityId: string) {
  if (!mongoose.isValidObjectId(activityId)) throw new AppError(400, '活动 ID 无效');
  if (!await Activity.exists({ _id: activityId })) throw new AppError(404, '活动不存在');
  const user = await User.findByIdAndUpdate(
    userId, { $addToSet: { favoriteActivities: activityId } }, { new: true }
  ).select('favoriteActivities');
  if (!user) throw new AppError(404, '用户不存在');
  return user.favoriteActivities;
}
```

Implement `removeFavorite` with the same ID validation and `$pull`, without requiring the activity to exist. Implement `getFavorites` by selecting and populating `favoriteActivities`, then returning `user.favoriteActivities.filter(Boolean)`.

- [ ] **Step 4: Run service tests and verify green**

Run: `cd backend && npm test -- src/services/UserService.test.ts`

Expected: PASS.

- [ ] **Step 5: Add controller methods and authenticated routes**

Add `getFavorites`, `addFavorite`, and `removeFavorite` controller methods. Each checks `req.user`, calls the corresponding service method, and returns this stable envelope:

```ts
res.json({ success: true, data: { activities } });
res.json({ success: true, message: '收藏成功', data: { favoriteActivityIds } });
res.json({ success: true, message: '已取消收藏', data: { favoriteActivityIds } });
```

Register routes after `router.use(authenticateToken)`:

```ts
router.get('/favorites', asyncHandler(UserController.getFavorites));
router.put('/favorites/:activityId', asyncHandler(UserController.addFavorite));
router.delete('/favorites/:activityId', asyncHandler(UserController.removeFavorite));
```

- [ ] **Step 6: Document and verify the backend**

Document authentication, parameters, success responses, 400, 401, and 404 behavior in `docs/API.md`.

Run:

```bash
cd backend
npm run lint
npm run type-check
npm test
npm run build
```

Expected: all commands exit 0.

- [ ] **Step 7: Commit the backend task**

```bash
git add backend/src/models/User.ts backend/src/services/UserService.ts backend/src/services/UserService.test.ts backend/src/controllers/UserController.ts backend/src/routes/users.ts docs/API.md
git commit -m "feat: add activity favorites API"
```

### Task 2: Reusable frontend favorites state

**Files:**
- Modify: `frontend/src/api/user.ts`
- Create: `frontend/src/hooks/useFavorites.ts`
- Create: `frontend/src/hooks/useFavorites.test.tsx`

**Interfaces:**
- Consumes: Task 1 favorite endpoints.
- Produces: `useFavorites(enabled: boolean)` returning `favorites`, `favoriteIds`, `loading`, `error`, `mutatingId`, `toggleFavorite`, and `reload`.

- [ ] **Step 1: Write the failing hook test**

Mock `userAPI` and render a small harness around the hook. Verify that loading produces an ID set, a successful toggle calls the correct endpoint, and a failed toggle keeps the previous set.

```tsx
it('loads favorites and exposes their IDs', async () => {
  vi.mocked(userAPI.getFavorites).mockResolvedValue({
    success: true,
    data: { activities: [activity] }
  });
  const { result } = renderHook(() => useFavorites(true));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.favoriteIds.has(activity._id)).toBe(true);
});
```

- [ ] **Step 2: Run the focused test and verify red**

Run: `cd frontend && npm test -- src/hooks/useFavorites.test.tsx`

Expected: FAIL because the API methods and hook do not exist.

- [ ] **Step 3: Add API contracts and minimal hook**

Import the `Activity` type with `import type` to avoid a runtime cycle and add:

```ts
getFavorites: async (): Promise<{ success: boolean; data: { activities: Activity[] } }> =>
  api.get('/users/favorites'),
addFavorite: async (activityId: string) => api.put(`/users/favorites/${activityId}`),
removeFavorite: async (activityId: string) => api.delete(`/users/favorites/${activityId}`),
```

The hook loads only when `enabled` is true. `toggleFavorite(activityId)` determines the current state from `favoriteIds`, awaits the matching API request, and updates `favorites`/IDs only after success. It stores one `mutatingId` so double clicks cannot race.

- [ ] **Step 4: Run the focused and full frontend checks**

Run:

```bash
cd frontend
npm test -- src/hooks/useFavorites.test.tsx
npm run type-check
```

Expected: both commands exit 0.

- [ ] **Step 5: Commit the state task**

```bash
git add frontend/src/api/user.ts frontend/src/hooks/useFavorites.ts frontend/src/hooks/useFavorites.test.tsx
git commit -m "feat: add favorites client state"
```

### Task 3: Favorite controls and profile presentation

**Files:**
- Modify: `frontend/src/components/ActivityCard.tsx`
- Modify: `frontend/src/components/ActivityCard.test.tsx`
- Modify: `frontend/src/pages/ActivityList.tsx`
- Modify: `frontend/src/pages/ActivityDetail.tsx`
- Modify: `frontend/src/pages/Profile.tsx`
- Modify: `frontend/src/pages/Profile.css`

**Interfaces:**
- Consumes: `useFavorites(enabled)` from Task 2.
- Extends: `ActivityCardProps` with `isFavorite?: boolean`, `onToggleFavorite?: (activityId: string) => void`, and `favoriteLoading?: boolean`.

- [ ] **Step 1: Write failing ActivityCard interaction tests**

Add tests with a `vi.fn()` handler:

```tsx
it('announces and toggles an unfavorited activity', () => {
  const onToggleFavorite = vi.fn();
  renderCard({}, { isFavorite: false, onToggleFavorite });
  fireEvent.click(screen.getByRole('button', { name: '收藏活动' }));
  expect(onToggleFavorite).toHaveBeenCalledWith(activity._id);
});

it('announces the active favorite state', () => {
  renderCard({}, { isFavorite: true, onToggleFavorite: vi.fn() });
  expect(screen.getByRole('button', { name: '取消收藏' })).toBeInTheDocument();
});
```

Update the test helper to accept `Partial<ActivityCardProps>` and import `fireEvent` from Testing Library.

- [ ] **Step 2: Run the component test and verify red**

Run: `cd frontend && npm test -- src/components/ActivityCard.test.tsx`

Expected: FAIL because the favorite props and control do not exist.

- [ ] **Step 3: Implement the controlled favorite button**

Add an Ant Design text/shape button using `HeartOutlined`/`HeartFilled`. Stop propagation before invoking `onToggleFavorite(activity._id)`, expose the exact accessible labels from the tests, and hide the control when no handler is supplied.

- [ ] **Step 4: Connect activity list and detail**

Call `useFavorites(isAuthenticated)` in `ActivityList` and pass favorite state, toggle handler, and per-ID loading to every card.

Call the same hook in `ActivityDetail`; add a secondary action next to enrollment. When unauthenticated, clicking it navigates to `/login`. When authenticated, it invokes `toggleFavorite(activity._id)`.

- [ ] **Step 5: Add the profile favorites section**

Call `useFavorites(Boolean(user))` in `Profile`. Add a “我的收藏” tab/section that:

- shows a skeleton while loading;
- shows an error alert with `reload` when loading fails;
- shows `Empty` when no favorites exist;
- otherwise renders a responsive grid of `ActivityCard` components with `showActions={false}` and favorite removal enabled.

Add only the grid spacing needed to `Profile.css`; reuse current card breakpoints and Ant Design grid components.

- [ ] **Step 6: Run frontend verification**

Run:

```bash
cd frontend
npm run lint
npm run type-check
npm test
npm run build
```

Expected: all commands exit 0.

- [ ] **Step 7: Commit the presentation task**

```bash
git add frontend/src/components/ActivityCard.tsx frontend/src/components/ActivityCard.test.tsx frontend/src/pages/ActivityList.tsx frontend/src/pages/ActivityDetail.tsx frontend/src/pages/Profile.tsx frontend/src/pages/Profile.css
git commit -m "feat: expose activity favorites in the UI"
```

### Task 4: End-to-end verification and process records

**Files:**
- Modify: `PLAN.md`
- Modify: `AGENT_LOG.md`
- Modify: `SPEC_PROCESS.md`

**Interfaces:**
- Consumes: all outputs from Tasks 1–3.
- Produces: traceable test results, review findings, and task commit hashes.

- [ ] **Step 1: Run every project quality gate**

```bash
cd backend && npm run lint && npm run type-check && npm test && npm run build
cd ../frontend && npm run lint && npm run type-check && npm test && npm run build
```

Expected: all commands exit 0 with no failing tests.

- [ ] **Step 2: Request two-stage code review**

Use `superpowers:requesting-code-review`. First review conformance to the approved design and this plan; second review code quality, security, error handling, and test adequacy. Resolve verified findings and rerun affected checks.

- [ ] **Step 3: Update course evidence**

Record the actual skill names, prompts, red/green test observations, reviewer findings, human decisions, and commit hashes. Do not claim events that did not occur.

- [ ] **Step 4: Commit process evidence**

```bash
git add PLAN.md AGENT_LOG.md SPEC_PROCESS.md
git commit -m "docs: record favorites development process"
```
