import { RunContext } from "../state/context";

interface CourseProgressProps {
    context: RunContext;
    oncourse: () => void;
    offcourse: () => void;
    complete: () => void;
}

export function useCourseProgress(props: CourseProgressProps) {
    const { context, oncourse, offcourse, complete } = props;

    if (
        !context.course ||
        !context.checkpoints ||
        context.course.length === 0 ||
        context.checkpoints.length === 0
    )
        return;
}
