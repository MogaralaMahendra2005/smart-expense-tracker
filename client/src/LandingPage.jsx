
import "./LandingPage.css";

export default function LandingPage({ onGetStarted }) {
  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <a className="brand" href="#home">
          <span className="brand-icon">₹</span>
          Smart<span>Spend</span>
        </a>

        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#tools">Tools</a>
          <a href="#how-it-works">How it works</a>
        </div>

        <button
          className="nav-cta"
          onClick={onGetStarted}
        >
          Open Tracker <span>↗</span>
        </button>
      </nav>

      <main>
        <section className="hero" id="home">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="status-dot" />
              YOUR MONEY, MADE CLEARER
            </div>

            <h1>
              Make every rupee
              <br />
              <span>count.</span>
            </h1>

            <p className="hero-description">
              Take control of your finances. Track spending,
              plan your budget, and build better money habits
              with one simple workspace.
            </p>

            <div className="hero-actions">
              <button
                className="primary-cta"
                onClick={onGetStarted}
              >
                Get started free <span>→</span>
              </button>
              <a className="secondary-cta" href="#features">
                Explore features ↓
              </a>
            </div>

            <div className="hero-note">
              <span>✓</span> Simple tracking
              <span>✓</span> Clear insights
              <span>✓</span> Your financial goals
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-glow" />

            <div className="preview-card">
              <div className="preview-header">
                <div>
                  <span className="preview-label">
                    YOUR FINANCES
                  </span>
                  <h3>Overview</h3>
                </div>
                <span className="preview-menu">•••</span>
              </div>

              <div className="preview-balance">
                <span>Total balance</span>
                <h2>₹24,850.00</h2>
                <span className="preview-growth">
                  ↗ Example dashboard preview
                </span>
              </div>

              <div className="preview-stats">
                <div>
                  <span className="stat-symbol income-symbol">↙</span>
                  <p>Income</p>
                  <strong>₹32,000</strong>
                </div>
                <div>
                  <span className="stat-symbol expense-symbol">↗</span>
                  <p>Expenses</p>
                  <strong>₹7,150</strong>
                </div>
              </div>

              <div className="preview-chart-heading">
                <strong>Spending overview</strong>
                <span>Illustrative data</span>
              </div>

              <div className="chart-bars">
                {[38, 57, 44, 74, 53, 88, 62, 46, 69, 94, 58, 78].map(
                  (height, index) => (
                    <div className="chart-bar-wrap" key={index}>
                      <div
                        className={`chart-bar ${index === 9 ? "chart-bar-highlight" : ""}`}
                        style={{ height: `${height}%` }}
                      />
                    </div>
                  )
                )}
              </div>

              <div className="chart-months">
                <span>JAN</span>
                <span>MAR</span>
                <span>MAY</span>
                <span>JUL</span>
                <span>SEP</span>
                <span>DEC</span>
              </div>
            </div>

            <div className="floating-note">
              <span className="floating-icon">↗</span>
              <div>
                <strong>Spend with purpose</strong>
                <p>Small steps. Better habits.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="trust-strip">
          <span>ONE PLACE FOR YOUR MONEY</span>
          <div>Track spending</div>
          <div>Plan your budget</div>
          <div>Understand your habits</div>
          <div>Work toward your goals</div>
        </section>

        <section className="features-section" id="features">
          <div className="section-heading">
            <span className="eyebrow">BUILT FOR EVERYDAY FINANCES</span>
            <h2>
              Less guessing.
              <br />
              <span>More clarity.</span>
            </h2>
            <p>
              The essentials you need to understand your money,
              all in one place.
            </p>
          </div>

          <div className="feature-grid">
            <article className="feature-card">
              <div className="feature-icon">↗</div>
              <h3>Expense tracking</h3>
              <p>
                Record income and expenses and keep your transactions
                organized by category.
              </p>
              <a href="#how-it-works">Explore tracking ↗</a>
            </article>

            <article className="feature-card">
              <div className="feature-icon">◎</div>
              <h3>Spending insights</h3>
              <p>
                Use visual summaries and category charts to understand
                where your money goes.
              </p>
              <a href="#how-it-works">Explore insights ↗</a>
            </article>

            <article className="feature-card" id="tools">
              <div className="feature-icon">◷</div>
              <h3>Budget planning</h3>
              <p>
                Plan your spending, estimate savings, and set
                practical financial goals.
              </p>
              <a href="#how-it-works">Explore planning ↗</a>
            </article>
          </div>
        </section>

        <section className="how-section" id="how-it-works">
          <div className="how-copy">
            <span className="eyebrow">A SIMPLE ROUTINE</span>
            <h2>
              Your money journey,
              <br />
              <span>step by step.</span>
            </h2>
            <p>
              Start with what you earn and spend. Build awareness
              gradually, then use what you learn to make better
              financial decisions.
            </p>
            <button className="primary-cta" onClick={onGetStarted}>
              Open your tracker <span>→</span>
            </button>
          </div>

          <div className="steps-list">
            <article className="step-item">
              <span>01</span>
              <div>
                <h3>Record your transactions</h3>
                <p>Add income and expenses or import a supported CSV.</p>
              </div>
            </article>
            <article className="step-item">
              <span>02</span>
              <div>
                <h3>See the bigger picture</h3>
                <p>Review your totals and explore category breakdowns.</p>
              </div>
            </article>
            <article className="step-item">
              <span>03</span>
              <div>
                <h3>Make a plan</h3>
                <p>Use your spending insights to plan your next steps.</p>
              </div>
            </article>
          </div>
        </section>

        <section className="final-cta">
          <span className="eyebrow">A CLEARER VIEW STARTS HERE</span>
          <h2>Ready to get to know your money?</h2>
          <p>Start building better financial habits, one transaction at a time.</p>
          <button className="primary-cta" onClick={onGetStarted}>
            Get started <span>→</span>
          </button>
        </section>
      </main>

      <footer className="landing-footer">
        <a className="brand" href="#home">
          <span className="brand-icon">₹</span>
          Smart<span>Spend</span>
        </a>
        <p>Understand where your money goes.</p>
        <span>© {new Date().getFullYear()} SmartSpend</span>
      </footer>
    </div>
  );
}
