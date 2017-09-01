import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed
} from '@angular/core/testing';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { TextInputHighlightModule } from '../src';
import { Component } from '@angular/core';
import { HighlightTag } from '../src/highlight-tag.interface';
import { By } from '@angular/platform-browser';
import { TextInputHighlightComponent } from '../src/text-input-highlight.component';
import { FormsModule } from '@angular/forms';

@Component({
  template: `
    <div mwlTextInputHighlightContainer>
      <textarea
        mwlTextInputElement
        [(ngModel)]="text"
        #textarea>
      </textarea>
      <mwl-text-input-highlight
        [tags]="tags"
        [textInputElement]="textarea"
        (tagClick)="tagClick($event)"
        (tagMouseEnter)="tagMouseEnter($event)"
        (tagMouseLeave)="tagMouseLeave($event)">
      </mwl-text-input-highlight>
    </div>
  `,
  styles: [
    `
    textarea {
      height: 50px;
    }
  `
  ]
})
class TestComponent {
  text: string;
  tags: HighlightTag[] = [];
  tagCssClass: string;
  tagClick = sinon.spy();
  tagMouseEnter = sinon.spy();
  tagMouseLeave = sinon.spy();
}

function createComponent({
  text,
  tags
}: {
  text: string;
  tags: HighlightTag[];
}) {
  const fixture: ComponentFixture<TestComponent> = TestBed.createComponent(
    TestComponent
  );
  fixture.componentInstance.text = text;
  fixture.componentInstance.tags = tags;
  fixture.detectChanges();
  const textarea = fixture.debugElement.query(By.css('textarea'));
  const highlight = fixture.debugElement.query(
    By.directive(TextInputHighlightComponent)
  );
  return { fixture, textarea, highlight };
}

function flushTagsChanges(fixture: ComponentFixture<TestComponent>) {
  fixture.detectChanges();
  flush();
  fixture.detectChanges();
}

describe('mwl-text-input-highlight component', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule, TextInputHighlightModule],
      declarations: [TestComponent]
    });
  });

  it(
    'should highlight all given tags',
    fakeAsync(() => {
      const { highlight, fixture } = createComponent({
        text: 'this is some text',
        tags: [{ indices: { start: 8, end: 12 } }]
      });
      flushTagsChanges(fixture);
      expect(highlight.nativeElement.children[0].innerHTML).to.deep.equal(
        'this is <span class="text-highlight-tag text-highlight-tag-id-0 ">some</span> text&nbsp;'
      );
    })
  );

  it(
    'should update the highlight element as the user types',
    fakeAsync(() => {
      const { highlight, fixture, textarea } = createComponent({
        text: 'this is some text',
        tags: [{ indices: { start: 8, end: 12 } }]
      });
      flushTagsChanges(fixture);
      const errorStub = sinon.stub(console, 'error'); // silence an error I cant debug easily
      textarea.nativeElement.value =
        'this is some text that the user has typed in';
      textarea.triggerEventHandler('input', {});
      flushTagsChanges(fixture);
      errorStub.restore();
      expect(highlight.nativeElement.children[0].innerHTML).to.deep.equal(
        'this is <span class="text-highlight-tag text-highlight-tag-id-0 ">some</span> text that the user has typed in&nbsp;'
      );
    })
  );

  it(
    'should allow a default highlight css tag to be set',
    fakeAsync(() => {
      TestBed.overrideComponent(TestComponent, {
        set: {
          template: `
            <div mwlTextInputHighlightContainer>
              <textarea
                mwlTextInputElement
                [(ngModel)]="text"
                #textarea>
              </textarea>
              <mwl-text-input-highlight
                [tags]="tags"
                [textInputElement]="textarea"
                [tagCssClass]="tagCssClass">
              </mwl-text-input-highlight>
            </div>
          `
        }
      });
      const { highlight, fixture } = createComponent({
        text: 'this is some text',
        tags: [{ indices: { start: 8, end: 12 } }]
      });
      fixture.componentInstance.tagCssClass = 'foo-class';
      flushTagsChanges(fixture);
      expect(highlight.nativeElement.children[0].innerHTML).to.deep.equal(
        'this is <span class="text-highlight-tag text-highlight-tag-id-0 foo-class">some</span> text&nbsp;'
      );
    })
  );

  it(
    'should copy all styling across from the textarea to the highlight element',
    fakeAsync(() => {
      const { highlight, fixture } = createComponent({
        text: 'this is some text',
        tags: [{ indices: { start: 8, end: 12 } }]
      });
      flushTagsChanges(fixture);
      expect(highlight.nativeElement.children[0].style.height).to.equal('50px');
    })
  );

  it('should throw when a non textarea element is passed to textInputElement', () => {
    TestBed.overrideComponent(TestComponent, {
      set: {
        template: `
            <div mwlTextInputHighlightContainer>
              <textarea></textarea>
              <input
                type="text"
                mwlTextInputElement
                [(ngModel)]="text"
                #input>
              <mwl-text-input-highlight
                [tags]="tags"
                [textInputElement]="input"
                [tagCssClass]="tagCssClass">
              </mwl-text-input-highlight>
            </div>
          `
      }
    });
    expect(
      fakeAsync(() => {
        createComponent({
          text: 'this is some text',
          tags: [{ indices: { start: 8, end: 12 } }]
        });
      })
    ).to.throw();
  });

  it(
    'tag ordering should not affect highlighting',
    fakeAsync(() => {
      const { highlight, fixture } = createComponent({
        text: 'this is some text',
        tags: [
          { indices: { start: 8, end: 12 } },
          { indices: { start: 0, end: 4 } }
        ]
      });
      flushTagsChanges(fixture);
      expect(highlight.nativeElement.children[0].innerHTML).to.deep.equal(
        '<span class="text-highlight-tag text-highlight-tag-id-1 ">this</span> is <span class="text-highlight-tag text-highlight-tag-id-0 ">some</span> text&nbsp;'
      );
    })
  );

  it(
    'should allow an individual tag css class to be overridden',
    fakeAsync(() => {
      const { highlight, fixture } = createComponent({
        text: 'this is some text',
        tags: [
          { indices: { start: 8, end: 12 } },
          { indices: { start: 0, end: 4 }, cssClass: 'foo-class' }
        ]
      });
      flushTagsChanges(fixture);
      expect(highlight.nativeElement.children[0].innerHTML).to.deep.equal(
        '<span class="text-highlight-tag text-highlight-tag-id-1 foo-class">this</span> is <span class="text-highlight-tag text-highlight-tag-id-0 ">some</span> text&nbsp;'
      );
    })
  );

  it('should throw when the start index of a tag is more than the end index', () => {
    expect(
      fakeAsync(() => {
        const { fixture } = createComponent({
          text: 'this is some text',
          tags: [{ indices: { start: 12, end: 8 } }]
        });
        flushTagsChanges(fixture);
      })
    ).to.throw();
  });

  it(
    'should skip tags where the tag indices dont exist on the textarea value',
    fakeAsync(() => {
      const { highlight, fixture } = createComponent({
        text: 'this is some text',
        tags: [{ indices: { start: 8, end: 100 } }]
      });
      flushTagsChanges(fixture);
      expect(highlight.nativeElement.children[0].innerHTML).to.deep.equal(
        'this is some text&nbsp;'
      );
    })
  );

  it('should throw when tag indices overlap', () => {
    expect(
      fakeAsync(() => {
        const { fixture } = createComponent({
          text: 'this is some text',
          tags: [
            { indices: { start: 8, end: 12 } },
            { indices: { start: 6, end: 10 } }
          ]
        });
        flushTagsChanges(fixture);
      })
    ).to.throw();
  });

  it(
    'should fire the mouse clicked event',
    fakeAsync(() => {
      const { highlight, fixture } = createComponent({
        text: 'this is some text',
        tags: [{ indices: { start: 8, end: 12 } }]
      });
      flushTagsChanges(fixture);
      fixture.debugElement
        .query(By.css('textarea'))
        .triggerEventHandler('click', {
          clientX: 45,
          clientY: 75
        });
      fixture.detectChanges();
      expect(fixture.componentInstance.tagClick).to.have.been.calledWith({
        target: highlight.nativeElement.querySelector('span'),
        tag: { indices: { start: 8, end: 12 } }
      });
    })
  );

  it(
    'should not fire the mouse clicked event',
    fakeAsync(() => {
      const { highlight, fixture } = createComponent({
        text: 'this is some text',
        tags: [{ indices: { start: 8, end: 12 } }]
      });
      flushTagsChanges(fixture);
      fixture.debugElement
        .query(By.css('textarea'))
        .triggerEventHandler('click', {
          clientX: 45,
          clientY: 10
        });
      fixture.detectChanges();
      expect(fixture.componentInstance.tagClick.callCount).to.equal(0);
    })
  );

  it(
    'should fire the mouse enter and leave events',
    fakeAsync(() => {
      const { highlight, fixture } = createComponent({
        text: 'this is some text',
        tags: [{ indices: { start: 8, end: 12 } }]
      });
      flushTagsChanges(fixture);
      fixture.debugElement
        .query(By.css('textarea'))
        .triggerEventHandler('mousemove', {
          clientX: 45,
          clientY: 75
        });
      fixture.detectChanges();
      expect(fixture.componentInstance.tagMouseEnter).to.have.been.calledWith({
        target: highlight.nativeElement.querySelector('span'),
        tag: { indices: { start: 8, end: 12 } }
      });
      expect(fixture.componentInstance.tagMouseLeave.callCount).to.equal(0);
      fixture.debugElement
        .query(By.css('textarea'))
        .triggerEventHandler('mousemove', {
          clientX: 44,
          clientY: 75
        });
      fixture.detectChanges();
      expect(fixture.componentInstance.tagMouseEnter.callCount).to.equal(1);
      fixture.debugElement
        .query(By.css('textarea'))
        .triggerEventHandler('mousemove', {
          clientX: 45,
          clientY: 10
        });
      fixture.detectChanges();
      expect(fixture.componentInstance.tagMouseLeave).to.have.been.calledWith({
        target: highlight.nativeElement.querySelector('span'),
        tag: { indices: { start: 8, end: 12 } }
      });
    })
  );

  it(
    'should fire the mouse leave event when the textarea is not moused over anymore',
    fakeAsync(() => {
      const { highlight, fixture } = createComponent({
        text: 'this is some text',
        tags: [{ indices: { start: 8, end: 12 } }]
      });
      flushTagsChanges(fixture);
      fixture.debugElement
        .query(By.css('textarea'))
        .triggerEventHandler('mousemove', {
          clientX: 45,
          clientY: 75
        });
      fixture.detectChanges();
      expect(fixture.componentInstance.tagMouseEnter).to.have.been.calledWith({
        target: highlight.nativeElement.querySelector('span'),
        tag: { indices: { start: 8, end: 12 } }
      });
      expect(fixture.componentInstance.tagMouseLeave.callCount).to.equal(0);
      fixture.debugElement
        .query(By.css('textarea'))
        .triggerEventHandler('mouseleave', {
          clientX: 44,
          clientY: 75
        });
      fixture.detectChanges();
      expect(fixture.componentInstance.tagMouseLeave).to.have.been.calledWith({
        target: highlight.nativeElement.querySelector('span'),
        tag: { indices: { start: 8, end: 12 } }
      });
    })
  );
});
