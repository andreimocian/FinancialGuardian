type Props = { amount: number }

export default function SavingsHeadline({ amount }: Props) {
  return <h1>You saved ${amount}</h1>
}